import { Test, TestingModule } from '@nestjs/testing';
import { NplController } from './npl.controller';

describe('NplController', () => {
  let controller: NplController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NplController],
    }).compile();

    controller = module.get<NplController>(NplController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
