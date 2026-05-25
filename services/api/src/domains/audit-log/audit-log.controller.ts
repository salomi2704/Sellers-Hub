import {
  Controller,
  Get,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { RequirePermissions } from '../../common/decorators/rbac.decorator';
import { Permission } from '../../common/enums/permission.enum';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { TenantInterceptor } from '../../common/interceptors/tenant.interceptor';
import { AuditLogService } from './audit-log.service';

@ApiTags('audit-logs')
@ApiBearerAuth()
@Controller({ path: 'audit-logs', version: '1' })
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(TenantInterceptor)
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get()
  @RequirePermissions(Permission.ADMIN_READ)
  list(@Query() query: PaginationQueryDto) {
    return this.auditLogService.list(query);
  }
}
