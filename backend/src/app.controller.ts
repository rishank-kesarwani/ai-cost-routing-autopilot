import { Controller, Get, Head, Res } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { Response } from 'express';

@ApiExcludeController()
@Controller()
export class AppController {
  @Get()
  getRoot() {
    return {
      service: 'LLM Cost & Routing Autopilot API',
      status: 'online',
      version: '1.0.0',
      docs: '/api/docs',
      health: '/health',
      apiPrefix: '/api/v1',
    };
  }

  @Head()
  headRoot(@Res() res: Response) {
    res.status(200).end();
  }
}
