import { IsNotEmpty, IsString } from 'class-validator';

export class SendTelegramMessageDto {
  @IsNotEmpty()
  chatId: string | number;

  @IsNotEmpty()
  @IsString()
  text: string;
}
