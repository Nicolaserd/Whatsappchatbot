import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { CreatePsePaymentDto } from './dto/create-pse-payment.dto';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('wompi/acceptance-tokens')
  getAcceptanceTokens() {
    return this.paymentsService.getAcceptanceContracts();
  }

  @Get('wompi/pse/financial-institutions')
  getPseFinancialInstitutions() {
    return this.paymentsService.getPseFinancialInstitutions();
  }

  @Post('pse')
  createPsePayment(@Body() body: CreatePsePaymentDto, @Req() request: Request) {
    return this.paymentsService.createPsePayment(
      body,
      this.getRequestIp(request),
    );
  }

  @Get('transactions/:id')
  findLocalTransaction(@Param('id') id: string) {
    return this.paymentsService.findLocalTransaction(id);
  }

  @Get('transactions/reference/:reference')
  findByReference(@Param('reference') reference: string) {
    return this.paymentsService.findByReference(reference);
  }

  @Get('wompi/transactions/:providerTransactionId/status')
  refreshProviderStatus(
    @Param('providerTransactionId') providerTransactionId: string,
  ) {
    return this.paymentsService.refreshProviderStatus(providerTransactionId);
  }

  @Post('wompi/webhook')
  @HttpCode(200)
  handleWompiWebhook(
    @Headers('x-event-checksum') checksum: string,
    @Body() event: unknown,
  ) {
    return this.paymentsService.handleWompiWebhook(event, checksum);
  }

  private getRequestIp(request: Request) {
    const forwardedFor = request.headers['x-forwarded-for'];

    if (typeof forwardedFor === 'string') {
      return forwardedFor.split(',')[0]?.trim();
    }

    return request.ip;
  }
}
