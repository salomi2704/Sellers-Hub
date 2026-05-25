import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
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
}
