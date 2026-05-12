import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { Roles } from '../decorators/roles.decorator';
import { Role } from '../enum/RoleUser.enum';
import { AuthGuard } from '../guards/auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { IaService } from './ia.service';
import { MessageDto } from './messageDto';

@Controller('ia')
export class IaController {

    constructor(private readonly iaService: IaService) {}

    @Post("/message")
    @Roles(Role.Admin)
    @UseGuards(AuthGuard, RolesGuard)
    async sendMessage(@Body() message: MessageDto){
        return await this.iaService.sendMessage(message)
    }
}
