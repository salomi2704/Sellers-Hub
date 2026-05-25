import { Body, Controller, Get, Post, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { RequirePermissions } from '../../common/decorators/rbac.decorator';
import { Permission } from '../../common/enums/permission.enum';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { TenantInterceptor } from '../../common/interceptors/tenant.interceptor';
import { CreateUserDto } from './dto/create-user.dto';
import { UserService } from './user.service';

@ApiTags('users')
@ApiBearerAuth()
@Controller({ path: 'users', version: '1' })
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(TenantInterceptor)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @RequirePermissions(Permission.USERS_MANAGE)
  list(@Query() query: PaginationQueryDto) {
    return this.userService.list(query);
  }

  @Post()
  @RequirePermissions(Permission.USERS_MANAGE)
  create(@Body() payload: CreateUserDto) {
    return this.userService.create(payload);
  }
}
