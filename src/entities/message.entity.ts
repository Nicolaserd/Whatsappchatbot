import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Users } from "./users.entity";

@Entity({
    name: 'MESSAGES',
  })
  export class Messages {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column({
      type: 'text',
      nullable: false,
    })
    content: string;
  
    @CreateDateColumn({ type: 'timestamptz' })
    createdAt: Date;
  
    @UpdateDateColumn({ type: 'timestamptz' })
    updatedAt: Date;
  
    @ManyToOne(() => Users, (user) => user.messages)
    @JoinColumn({ name: 'user_id' })
    user: Users[];
  }