import { Controller, Post } from '@nestjs/common';
import { MercadoPagoService } from './mercado-pago.service';

@Controller('mercado-pago')
export class MercadoPagoController {

    constructor(private readonly mercadoPagoService: MercadoPagoService) {}

    @Post()
    async createOrderMock (){
        this.mercadoPagoService.createOrderMock()
    }

}
