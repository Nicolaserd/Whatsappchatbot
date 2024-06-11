import { Injectable } from '@nestjs/common';

@Injectable()
export class UsersService {
    async onModuleInit() {
        await this.loadData();
      }
    
      private async loadData() {
        // Lógica para cargar los datos iniciales
        console.log('Preloading data...');
        // Ejemplo de carga de datos
        // await this.someRepository.save(initialData);
      }
}
