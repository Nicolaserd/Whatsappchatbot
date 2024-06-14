import { Injectable } from '@nestjs/common';

@Injectable()
export class MercadoPagoService {
    async createOrderMock (){
        return "Created Order"
    }
}
