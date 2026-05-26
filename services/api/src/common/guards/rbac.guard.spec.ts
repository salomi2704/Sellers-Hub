import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Permission } from '../enums/permission.enum';
import { Role } from '../enums/role.enum';
import { RbacGuard } from './rbac.guard';

describe('RbacGuard', () => {
  it('denies when required permission is missing', () => {
    const reflector = {
      getAllAndOverride: jest
        .fn()
        .mockReturnValueOnce(undefined)
        .mockReturnValueOnce([Permission.FINANCE_WRITE]),
    } as unknown as Reflector;

    const guard = new RbacGuard(reflector);
    const context = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({
          user: {
            role: Role.MANAGER,
            permissions: [Permission.FINANCE_READ],
          },
        }),
      }),
    } as unknown as ExecutionContext;

    expect(guard.canActivate(context)).toBe(false);
  });

  it('allows when role and permissions match', () => {
    const reflector = {
      getAllAndOverride: jest
        .fn()
        .mockReturnValueOnce([Role.ADMIN])
        .mockReturnValueOnce([Permission.ADMIN_READ]),
    } as unknown as Reflector;

    const guard = new RbacGuard(reflector);
    const context = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({
          user: {
            role: Role.ADMIN,
            permissions: [Permission.ADMIN_READ],
          },
        }),
      }),
    } as unknown as ExecutionContext;

    expect(guard.canActivate(context)).toBe(true);
  });
});
