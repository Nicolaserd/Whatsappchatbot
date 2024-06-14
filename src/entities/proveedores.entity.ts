import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToMany,
    JoinTable,

  } from 'typeorm';
import { Users } from './users.entity';
  

  @Entity({
    name: 'PROVEEDORES',
  })
  export class Proveedores {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column()
    nombre: string;

    @ManyToMany(() => Users, user => user.proveedores)
    @JoinTable()
    users: Users[];
  }