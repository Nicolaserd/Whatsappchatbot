import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({
  name: 'TELEGRAM_CONVERSATIONS',
})
export class TelegramConversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'varchar',
    length: 80,
    nullable: false,
  })
  chatId: string;

  @Column({
    type: 'text',
    nullable: false,
  })
  userMessage: string;

  @Column({
    type: 'text',
    nullable: false,
  })
  botMessage: string;

  @Column({
    type: 'int',
    nullable: false,
  })
  attemptNumber: number;

  @Column({
    type: 'boolean',
    default: false,
  })
  usedUnlockPin: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
