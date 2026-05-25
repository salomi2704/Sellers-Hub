import { Body, Controller, Get, Post, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { RequirePermissions } from '../../common/decorators/rbac.decorator';
import { Permission } from '../../common/enums/permission.enum';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { TenantInterceptor } from '../../common/interceptors/tenant.interceptor';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { TransactionService } from './transaction.service';

@ApiTags('transactions')
@ApiBearerAuth()
@Controller({ path: 'transactions', version: '1' })
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(TenantInterceptor)
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Get()
  @RequirePermissions(Permission.FINANCE_READ)
  list(@Query() query: PaginationQueryDto) {
    return this.transactionService.list(query);
  }

  @Post()
  @RequirePermissions(Permission.FINANCE_WRITE)
  create(@Body() payload: CreateTransactionDto) {
    return this.transactionService.create(payload);
  }
}
