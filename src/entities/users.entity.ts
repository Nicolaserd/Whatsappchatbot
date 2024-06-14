import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToMany,
    JoinColumn,
    UpdateDateColumn,
    CreateDateColumn,
    ManyToMany,
  } from 'typeorm';
  import { Messages } from './message.entity';
import { Role } from 'src/enum/RoleUser.enum';
import { Products } from './products.entity';
import { Proveedores } from './proveedores.entity';
  
  @Entity({
    name: 'USERS',
  })
  export class Users {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column({
      length: 50,
      type: 'varchar',
      nullable: true,
    })
    name: string;
  
    @Column({
      length: 50,
      unique: true,
      type: 'varchar',
      nullable: false,
    })
    email: string;
  
    @Column({
      length: 60,
      type: 'varchar',
      nullable: false,
    })
    password: string;
  
    @Column({
      type: 'int',
      nullable: true,
    })
    phone: number;
  
    @Column({
      nullable: true,
      length: 50,
    })
    country: string;
  
    @Column({
      nullable: true,
    })
    address: string;
  
    @Column({
      nullable: true,
      length: 50,
    })
    city: string;
  
    @Column({
        type: 'enum',
        enum: Role,
        default: Role.Usuario,
    })
    role: Role;

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt: Date;
  
    @UpdateDateColumn({ type: 'timestamptz' })
    updatedAt: Date;
  
    @OneToMany(() => Messages, (messages) => messages.user)
    @JoinColumn({ name: 'messages_id' })
    messages: Messages[];

    @OneToMany(() => Products, (product) => product.user)
    @JoinColumn({ name: 'products_id' })
    Products: Products[];

    @ManyToMany(() => Proveedores, proveedor => proveedor.users)
    proveedores: Proveedores[];

  }