import { Body, Controller, Post } from '@nestjs/common';
import { IaService } from './ia.service';
import { MessageDto } from './messageDto';

@Controller('ia')
export class IaController {

    constructor(private readonly iaService: IaService) {}

    @Post("/message")
    async sendMessage(@Body() message: MessageDto){
        return await this.iaService.sendMessage(message)
    }
}
