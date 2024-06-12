import { IsEmail, IsOptional, IsString, IsEnum, IsInt, Length, isNotEmpty, IsNotEmpty, IsUUID } from 'class-validator';
import { Role } from 'src/enum/RoleUser.enum';

export class CreateUserDto {

  @IsString()
  @Length(1, 50)
  @IsOptional()
  name?: string;

  @IsEmail()
  @Length(1, 50)
  email: string;

  @IsString()
  @Length(1, 60)
  password: string;

  @IsInt()
  @IsOptional()
  phone?: number;

  @IsString()
  @Length(1, 50)
  @IsOptional()
  country?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @Length(1, 50)
  @IsOptional()
  city?: string;

  @IsEnum(Role)
  @IsNotEmpty()
  role: Role;
}


export class UpdateUserDto {
   
    @IsUUID()
    @IsNotEmpty()
    id: string;

    @IsString()
    @Length(1, 50)
    @IsOptional()
    name?: string;
  
    @IsEmail()
    @Length(1, 50)
    @IsOptional()
    email?: string;
  
    @IsString()
    @Length(1, 60)
    @IsOptional()
    password?: string;
  
    @IsInt()
    @IsOptional()
    phone?: number;
  
    @IsString()
    @Length(1, 50)
    @IsOptional()
    country?: string;
  
    @IsString()
    @IsOptional()
    address?: string;
  
    @IsString()
    @Length(1, 50)
    @IsOptional()
    city?: string;
  
    @IsEnum(Role)
    @IsOptional()
    role?: Role;
  }
