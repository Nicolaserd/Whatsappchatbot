import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PaymentStatus } from '../enum/PaymentStatus.enum';

@Entity({
  name: 'PAYMENT_TRANSACTIONS',
})
export class PaymentTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255, unique: true, type: 'varchar' })
  reference: string;

  @Column({ length: 80, type: 'varchar', nullable: true })
  providerTransactionId: string;

  @Column({ length: 20, type: 'varchar', default: 'WOMPI' })
  provider: string;

  @Column({ length: 20, type: 'varchar', default: 'PSE' })
  paymentMethodType: string;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.Pending,
  })
  status: PaymentStatus;

  @Column({ type: 'int' })
  amountInCents: number;

  @Column({ length: 3, type: 'varchar', default: 'COP' })
  currency: string;

  @Column({ length: 120, type: 'varchar' })
  customerEmail: string;

  @Column({ length: 120, type: 'varchar' })
  customerFullName: string;

  @Column({ length: 20, type: 'varchar' })
  phoneNumber: string;

  @Column({ length: 10, type: 'varchar' })
  userLegalIdType: string;

  @Column({ length: 30, type: 'varchar' })
  userLegalId: string;

  @Column({ length: 40, type: 'varchar' })
  financialInstitutionCode: string;

  @Column({ length: 64, type: 'varchar' })
  paymentDescription: string;

  @Column({ type: 'text', nullable: true })
  asyncPaymentUrl: string;

  @Column({ type: 'text', nullable: true })
  redirectUrl: string;

  @Column({ length: 60, type: 'varchar', nullable: true })
  ipAddress: string;

  @Column({ type: 'jsonb', nullable: true })
  providerResponse: unknown;

  @Column({ type: 'jsonb', nullable: true })
  providerWebhook: unknown;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
