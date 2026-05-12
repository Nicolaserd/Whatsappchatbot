import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
  MinLength,
} from "class-validator";

export class SignUpDto{
    @IsNotEmpty({ message: 'El nombre es obligatorio' })
    @IsString()
    @Length(1, 50)
    name: string;

    @IsNotEmpty({ message: 'El apellido es obligatorio' })
    @IsString()
    @Length(1, 100)
    lastName: string;

    @IsNotEmpty({message:'El email es obligatorio'})
    @IsEmail({}, { message: 'El correo electrónico debe ser válido' })
    email:string

    @IsNotEmpty({ message: 'La contraseña es obligatoria' })
    @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
    @MaxLength(15, { message: 'La contraseña no debe superar los 15 caracteres' })
    @Matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[a-zA-Z\d!@#$%^&*]*$/,
      {
        message:
          'La contraseña debe contener al menos una letra minúscula, una letra mayúscula, un número y uno de los siguientes caracteres especiales: !@#$%^&*',
      },
    )
    password:string

    @IsOptional()
    @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
    @MaxLength(15, { message: 'La contraseña no debe superar los 15 caracteres' })
    @Matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[a-zA-Z\d!@#$%^&*]*$/,
      {
        message:
          'La contraseña debe contener al menos una letra minúscula, una letra mayúscula, un número y uno de los siguientes caracteres especiales: !@#$%^&*',
      },
    )
    confirmPassword?:string
}
