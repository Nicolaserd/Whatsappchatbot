import {
  Equals,
  IsBoolean,
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreatePsePaymentDto {
  @IsInt()
  @Min(100)
  @Max(999999999)
  amountInCents: number;

  @IsEmail()
  @MaxLength(120)
  customerEmail: string;

  @IsString()
  @Length(3, 120)
  customerFullName: string;

  @IsString()
  @Matches(/^\+?[0-9]{7,15}$/)
  phoneNumber: string;

  @IsInt()
  @IsIn([0, 1])
  userType: 0 | 1;

  @IsString()
  @IsIn(['CC', 'CE', 'NIT', 'TI', 'PP'])
  userLegalIdType: string;

  @IsString()
  @Length(4, 30)
  @Matches(/^[0-9A-Za-z.-]+$/)
  userLegalId: string;

  @IsString()
  @Length(1, 40)
  @Matches(/^[0-9A-Za-z_-]+$/)
  financialInstitutionCode: string;

  @IsString()
  @Length(3, 64)
  paymentDescription: string;

  @IsOptional()
  @IsString()
  @Length(6, 255)
  @Matches(/^[0-9A-Za-z_-]+$/)
  reference?: string;

  @IsOptional()
  @IsUrl({ require_tld: false, protocols: ['http', 'https'] })
  redirectUrl?: string;

  @IsBoolean()
  @Equals(true)
  acceptedWompiPolicy: boolean;

  @IsBoolean()
  @Equals(true)
  acceptedPersonalDataAuth: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  referenceOne?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[0-9]{8}$/)
  referenceTwo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  referenceThree?: string;
}
