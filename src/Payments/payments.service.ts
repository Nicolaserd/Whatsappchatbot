import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, randomUUID, timingSafeEqual } from 'crypto';
import { Repository } from 'typeorm';
import { PaymentTransaction } from '../entities/payment-transaction.entity';
import { PaymentStatus } from '../enum/PaymentStatus.enum';
import { CreatePsePaymentDto } from './dto/create-pse-payment.dto';

type WompiAcceptanceResponse = {
  data: {
    presigned_acceptance?: AcceptanceToken;
    presigned_personal_data_auth?: AcceptanceToken;
  };
};

type AcceptanceToken = {
  acceptance_token: string;
  permalink: string;
  type: string;
};

type WompiResponse<T> = {
  data: T;
  meta?: unknown;
};

type WompiTransaction = {
  id: string;
  reference: string;
  status: PaymentStatus;
  amount_in_cents: number;
  currency: string;
  customer_email: string;
  payment_method_type: string;
  payment_method?: {
    type?: string;
    extra?: {
      async_payment_url?: string;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
  status_message?: string;
};

type WompiEvent = {
  event?: string;
  data?: {
    transaction?: WompiTransaction;
    [key: string]: unknown;
  };
  signature?: {
    checksum?: string;
    properties?: string[];
    timestamp?: number;
  };
  sent_at?: string;
};

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(PaymentTransaction)
    private readonly paymentsRepository: Repository<PaymentTransaction>,
  ) {}

  async getAcceptanceContracts() {
    const tokens = await this.fetchAcceptanceTokens();

    return {
      wompiPolicy: {
        permalink: tokens.acceptance.permalink,
        type: tokens.acceptance.type,
      },
      personalDataAuth: {
        permalink: tokens.personalDataAuth.permalink,
        type: tokens.personalDataAuth.type,
      },
    };
  }

  private async fetchAcceptanceTokens() {
    const publicKey = this.requireEnv('WOMPI_PUBLIC_KEY');
    const response = await this.wompiRequest<WompiAcceptanceResponse>(
      `/merchants/${publicKey}`,
      { auth: false },
    );

    const acceptance = response.data.presigned_acceptance;
    const personalDataAuth = response.data.presigned_personal_data_auth;

    if (!acceptance?.acceptance_token || !personalDataAuth?.acceptance_token) {
      throw new InternalServerErrorException(
        'Wompi did not return acceptance tokens.',
      );
    }

    return {
      acceptance,
      personalDataAuth,
    };
  }

  async getPseFinancialInstitutions() {
    const response = await this.wompiRequest<
      WompiResponse<Array<{ code: string; name: string }>>
    >('/pse/financial_institutions', {
      auth: true,
      tokenType: 'public',
    });

    return response.data;
  }

  async createPsePayment(dto: CreatePsePaymentDto, ipAddress?: string) {
    const reference = dto.reference ?? this.generateReference();
    const existing = await this.paymentsRepository.findOneBy({ reference });

    if (existing) {
      throw new BadRequestException('Payment reference already exists.');
    }

    const currency = 'COP';
    const paymentDescription = this.normalizeDescription(
      dto.paymentDescription,
    );
    const redirectUrl = this.resolveRedirectUrl(dto.redirectUrl);
    const tokens = await this.fetchAcceptanceTokens();
    const signature = this.generateIntegritySignature(
      reference,
      dto.amountInCents,
      currency,
    );

    const saved = await this.paymentsRepository.manager.transaction(
      async (manager) =>
        manager.save(PaymentTransaction, {
          reference,
          amountInCents: dto.amountInCents,
          currency,
          customerEmail: dto.customerEmail,
          customerFullName: dto.customerFullName,
          phoneNumber: dto.phoneNumber,
          userLegalIdType: dto.userLegalIdType,
          userLegalId: dto.userLegalId,
          financialInstitutionCode: dto.financialInstitutionCode,
          paymentDescription,
          redirectUrl,
          ipAddress,
          status: PaymentStatus.Pending,
        }),
    );

    try {
      const payload = {
        amount_in_cents: dto.amountInCents,
        currency,
        customer_email: dto.customerEmail,
        payment_method_type: 'PSE',
        payment_method: {
          type: 'PSE',
          user_type: dto.userType,
          user_legal_id_type: dto.userLegalIdType,
          user_legal_id: dto.userLegalId,
          financial_institution_code: dto.financialInstitutionCode,
          payment_description: paymentDescription,
          ...(dto.referenceOne || ipAddress
            ? { reference_one: dto.referenceOne ?? ipAddress }
            : {}),
          ...(dto.referenceTwo ? { reference_two: dto.referenceTwo } : {}),
          ...(dto.referenceThree
            ? { reference_three: dto.referenceThree }
            : {}),
        },
        customer_data: {
          phone_number: dto.phoneNumber,
          full_name: dto.customerFullName,
        },
        reference,
        signature,
        acceptance_token: tokens.acceptance.acceptance_token,
        accept_personal_auth: tokens.personalDataAuth.acceptance_token,
        ...(redirectUrl ? { redirect_url: redirectUrl } : {}),
        ...(ipAddress ? { ip: ipAddress } : {}),
      };

      const created = await this.wompiRequest<WompiResponse<WompiTransaction>>(
        '/transactions',
        {
          method: 'POST',
          auth: true,
          tokenType: 'private',
          body: payload,
        },
      );

      const transaction = created.data;
      const asyncPaymentUrl = this.extractAsyncPaymentUrl(transaction);

      await this.paymentsRepository.update(saved.id, {
        providerTransactionId: transaction.id,
        status: transaction.status ?? PaymentStatus.Pending,
        asyncPaymentUrl,
        providerResponse: created,
      });

      return {
        id: saved.id,
        reference,
        providerTransactionId: transaction.id,
        status: transaction.status ?? PaymentStatus.Pending,
        asyncPaymentUrl,
        contracts: {
          wompiPolicy: tokens.acceptance.permalink,
          personalDataAuth: tokens.personalDataAuth.permalink,
        },
      };
    } catch (error) {
      await this.paymentsRepository.update(saved.id, {
        status: PaymentStatus.Error,
        providerResponse: this.serializeError(error),
      });

      throw error;
    }
  }

  async findLocalTransaction(id: string) {
    const payment = await this.paymentsRepository.findOneBy({ id });

    if (!payment) {
      throw new NotFoundException('Payment transaction not found.');
    }

    return this.toPublicPayment(payment);
  }

  async findByReference(reference: string) {
    const payment = await this.paymentsRepository.findOneBy({ reference });

    if (!payment) {
      throw new NotFoundException('Payment transaction not found.');
    }

    return this.toPublicPayment(payment);
  }

  async refreshProviderStatus(providerTransactionId: string) {
    const response = await this.wompiRequest<WompiResponse<WompiTransaction>>(
      `/transactions/${providerTransactionId}`,
      {
        auth: true,
        tokenType: 'public',
      },
    );

    const transaction = response.data;
    const payment = await this.paymentsRepository.findOne({
      where: [
        { providerTransactionId: transaction.id },
        { reference: transaction.reference },
      ],
    });

    if (payment) {
      await this.paymentsRepository.update(payment.id, {
        providerTransactionId: transaction.id,
        status: transaction.status,
        asyncPaymentUrl: this.extractAsyncPaymentUrl(transaction),
        providerResponse: response,
      });
    }

    return {
      id: transaction.id,
      reference: transaction.reference,
      status: transaction.status,
      amountInCents: transaction.amount_in_cents,
      currency: transaction.currency,
      paymentMethodType: transaction.payment_method_type,
      asyncPaymentUrl: this.extractAsyncPaymentUrl(transaction),
      statusMessage: transaction.status_message,
    };
  }

  async handleWompiWebhook(event: unknown, headerChecksum?: string) {
    const wompiEvent = event as WompiEvent;

    this.verifyEventChecksum(wompiEvent, headerChecksum);

    if (wompiEvent.event !== 'transaction.updated') {
      return { ok: true, ignored: true };
    }

    const transaction = wompiEvent.data?.transaction;

    if (!transaction?.id || !transaction.reference) {
      throw new BadRequestException('Invalid Wompi transaction event.');
    }

    const payment = await this.paymentsRepository.findOne({
      where: [
        { providerTransactionId: transaction.id },
        { reference: transaction.reference },
      ],
    });

    if (!payment) {
      return { ok: true, ignored: true, reason: 'transaction_not_found' };
    }

    await this.paymentsRepository.update(payment.id, {
      providerTransactionId: transaction.id,
      status: transaction.status,
      asyncPaymentUrl: this.extractAsyncPaymentUrl(transaction),
      providerWebhook: wompiEvent,
    });

    return {
      ok: true,
      id: payment.id,
      reference: transaction.reference,
      status: transaction.status,
    };
  }

  private generateIntegritySignature(
    reference: string,
    amountInCents: number,
    currency: string,
  ) {
    const integritySecret = this.requireEnv('WOMPI_INTEGRITY_SECRET');
    return this.sha256(
      `${reference}${amountInCents}${currency}${integritySecret}`,
    );
  }

  private verifyEventChecksum(event: WompiEvent, headerChecksum?: string) {
    const eventsSecret = this.requireEnv('WOMPI_EVENTS_SECRET');
    const signature = event.signature;
    const expectedChecksum = headerChecksum ?? signature?.checksum;

    if (
      !signature?.properties?.length ||
      !signature.timestamp ||
      !expectedChecksum
    ) {
      throw new UnauthorizedException('Missing Wompi webhook signature.');
    }

    const values = signature.properties
      .map((property) => this.readDataPath(event.data, property))
      .join('');

    const calculated = this.sha256(
      `${values}${signature.timestamp}${eventsSecret}`,
    );

    if (!this.secureEquals(calculated, expectedChecksum)) {
      throw new UnauthorizedException('Invalid Wompi webhook signature.');
    }
  }

  private readDataPath(data: WompiEvent['data'], path: string) {
    const value = path.split('.').reduce<unknown>((current, key) => {
      if (current && typeof current === 'object') {
        return (current as Record<string, unknown>)[key];
      }

      return undefined;
    }, data);

    return value === undefined || value === null ? '' : String(value);
  }

  private extractAsyncPaymentUrl(transaction: WompiTransaction) {
    return transaction.payment_method?.extra?.async_payment_url ?? null;
  }

  private toPublicPayment(payment: PaymentTransaction) {
    return {
      id: payment.id,
      reference: payment.reference,
      providerTransactionId: payment.providerTransactionId,
      provider: payment.provider,
      paymentMethodType: payment.paymentMethodType,
      status: payment.status,
      amountInCents: payment.amountInCents,
      currency: payment.currency,
      asyncPaymentUrl: payment.asyncPaymentUrl,
      redirectUrl: payment.redirectUrl,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
    };
  }

  private normalizeDescription(description: string) {
    return description.replace(/'/g, '').trim().slice(0, 64);
  }

  private resolveRedirectUrl(redirectUrl?: string) {
    const value = redirectUrl ?? process.env.WOMPI_REDIRECT_URL;

    if (!value) {
      return undefined;
    }

    const parsed = new URL(value);
    const isLocal = ['localhost', '127.0.0.1'].includes(parsed.hostname);

    if (parsed.protocol !== 'https:' && !isLocal) {
      throw new BadRequestException('Payment redirect URL must use HTTPS.');
    }

    return value;
  }

  private generateReference() {
    return `PSE-${Date.now()}-${randomUUID().slice(0, 8)}`;
  }

  private async wompiRequest<T>(
    path: string,
    options: {
      method?: string;
      auth?: boolean;
      tokenType?: 'public' | 'private';
      body?: unknown;
    } = {},
  ): Promise<T> {
    const baseUrl = this.wompiBaseUrl();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (options.auth) {
      const key =
        options.tokenType === 'private'
          ? this.requireEnv('WOMPI_PRIVATE_KEY')
          : this.requireEnv('WOMPI_PUBLIC_KEY');
      headers.Authorization = `Bearer ${key}`;
    }

    const response = await fetch(`${baseUrl}${path}`, {
      method: options.method ?? 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    const payload = (await response.json().catch(() => ({}))) as T & {
      error?: { reason?: string; messages?: unknown };
    };

    if (!response.ok) {
      throw new BadRequestException({
        message: 'Wompi request failed.',
        statusCode: response.status,
        error: payload.error ?? payload,
      });
    }

    return payload;
  }

  private wompiBaseUrl() {
    const env = (process.env.WOMPI_ENV ?? 'sandbox').toLowerCase();

    if (env === 'production' || env === 'prod') {
      return 'https://production.wompi.co/v1';
    }

    return 'https://sandbox.wompi.co/v1';
  }

  private sha256(value: string) {
    return createHash('sha256').update(value, 'utf8').digest('hex');
  }

  private secureEquals(a: string, b: string) {
    const left = Buffer.from(a.toLowerCase(), 'hex');
    const right = Buffer.from(b.toLowerCase(), 'hex');

    if (left.length !== right.length) {
      return false;
    }

    return timingSafeEqual(left, right);
  }

  private requireEnv(name: string) {
    const value = process.env[name];

    if (!value) {
      throw new InternalServerErrorException(
        `Missing ${name} environment variable.`,
      );
    }

    return value;
  }

  private serializeError(error: unknown) {
    if (error instanceof Error) {
      return {
        name: error.name,
        message: error.message,
      };
    }

    return { message: String(error) };
  }
}
