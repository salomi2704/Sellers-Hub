import { Controller, Get, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { HealthService } from './health.service';

@ApiTags('health')
@Controller({ path: 'health', version: '1' })
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get('liveness')
  liveness() {
    return this.healthService.liveness();
  }

  @Get('readiness')
  readiness() {
    return this.healthService.readiness();
  }

  @Get('metrics')
  async metrics(@Res() response: Response) {
    const metrics = await this.healthService.metrics();
    response.setHeader('Content-Type', metrics.contentType);
    response.send(metrics.payload);
  }
}
