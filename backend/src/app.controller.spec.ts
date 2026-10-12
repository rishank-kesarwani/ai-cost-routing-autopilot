import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
    }).compile();

    appController = module.get<AppController>(AppController);
  });

  it('should return service metadata on getRoot', () => {
    const result = appController.getRoot();
    expect(result.status).toBe('online');
    expect(result.docs).toBe('/api/docs');
    expect(result.health).toBe('/health');
  });

  it('should respond with status 200 on headRoot', () => {
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      end: jest.fn(),
    } as any;

    appController.headRoot(mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.end).toHaveBeenCalled();
  });
});
