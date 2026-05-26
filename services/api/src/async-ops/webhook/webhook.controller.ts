import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RequirePermissions } from '../../common/decorators/rbac.decorator';
import { Permission } from '../../common/enums/permission.enum';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { TenantInterceptor } from '../../common/interceptors/tenant.interceptor';
import { TenantRepository } from '../../common/tenant-repository';
import { CreateWebhookEndpointDto } from './dto/create-webhook-endpoint.dto';
import { UpdateWebhookEndpointStatusDto } from './dto/update-webhook-endpoint-status.dto';
import { WebhookService } from './webhook.service';

@ApiTags('webhooks')
@ApiBearerAuth()
@Controller({ path: 'webhooks', version: '1' })
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(TenantInterceptor)
export class WebhookController {
  constructor(
    private readonly webhookService: WebhookService,
    private readonly tenantRepository: TenantRepository,
  ) {}

  @Post('endpoints')
  @RequirePermissions(Permission.USERS_MANAGE)
  createEndpoint(@Body() payload: CreateWebhookEndpointDto) {
    return this.webhookService.createEndpoint(this.tenantRepository.scope(), payload);
  }

  @Get('endpoints')
  @RequirePermissions(Permission.USERS_MANAGE)
  listEndpoints() {
    return this.webhookService.listEndpoints(this.tenantRepository.scope());
  }

  @Patch('endpoints/:id')
  @RequirePermissions(Permission.USERS_MANAGE)
  updateStatus(
    @Param('id') id: string,
    @Body() payload: UpdateWebhookEndpointStatusDto,
  ) {
    return this.webhookService.updateEndpointStatus(
      this.tenantRepository.scope(),
      id,
      payload.isActive,
    );
  }

  @Post('events/:eventId/replay')
  @RequirePermissions(Permission.ADMIN_READ)
  replay(@Param('eventId') eventId: string) {
    return this.webhookService.replayEvent(this.tenantRepository.scope(), eventId);
  }
}
