import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    JoinColumn,
    UpdateDateColumn,
    CreateDateColumn,
    ManyToOne,
  } from 'typeorm';
import { Users } from './users.entity';
  

  @Entity({
    name: 'PRODUCTS',
  })
  export class Products {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column({
      length: 50,
      type: 'varchar',
      nullable: true,
    })
    name: string;
      
    @Column({
      nullable: false,
   
    })
    stock: number;
  
    @CreateDateColumn({ type: 'timestamptz' })
    createdAt: Date;
  
    @UpdateDateColumn({ type: 'timestamptz' })
    updatedAt: Date;
  
    @ManyToOne(() => Users, (user) => user.Products)
    @JoinColumn({ name: 'user_id' })
    user: Users;
  }