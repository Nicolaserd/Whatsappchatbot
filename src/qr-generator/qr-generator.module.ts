import { Module } from '@nestjs/common';
import { QrGeneratorController } from './qr-generator.controller';
import { QrGeneratorService } from './qr-generator.service';

@Module({
  controllers: [QrGeneratorController],
  providers: [QrGeneratorService]
})
export class QrGeneratorModule {}
