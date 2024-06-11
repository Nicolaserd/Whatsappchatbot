import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WhatsappModule } from './whatsapp/whatsapp.module';
import { NplModule } from './npl/npl.module';
import { QrGeneratorModule } from './qr-generator/qr-generator.module';
import { AuthModule } from './Auth/auth.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import typeorm from './config/typeorm';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { config as dotenvConfig } from 'dotenv';

dotenvConfig({ path: '.env' });


@Module({
  imports: [
    ConfigModule.forRoot({
      //? utiliza como fuente  typeorm el archivo (donde se definen las propiedades de acceso a la bd)
      isGlobal: true,
      load: [typeorm],
    }),
    //! Se define el modulo de type orm solicita la inyeccion del
    TypeOrmModule.forRootAsync({
      //! archivo de configuracion
      inject: [ConfigService],
      //? utiliza el objeto de configuracion no como un objeto sino como una instancia de data source
      useFactory: (config: ConfigService) => config.get('typeorm'),
    }),
    WhatsappModule, NplModule, QrGeneratorModule,AuthModule,
    JwtModule.register({
      global: true,
      //? Pasar un tiempo de vida al jwt
      signOptions: { expiresIn: '1h' },
      secret: process.env.JWT_SECRET,
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
