import { IsDate, IsNotEmpty, IsString, Matches } from "class-validator";

export class MessageDto {

    @IsNotEmpty()
    @IsString()
    message:string;

    @IsNotEmpty()
    @IsString()
    @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
        message: 'hora must be in the format HH:mm'
    })
    hora:string;

}