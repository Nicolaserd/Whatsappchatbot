import { Test, TestingModule } from '@nestjs/testing';
import { QrGeneratorController } from './qr-generator.controller';

describe('QrGeneratorController', () => {
  let controller: QrGeneratorController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [QrGeneratorController],
    }).compile();

    controller = module.get<QrGeneratorController>(QrGeneratorController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
