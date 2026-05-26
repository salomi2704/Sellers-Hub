import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../infrastructure/prisma/prisma.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  it('rejects expired/invalid refresh tokens with unauthorized', async () => {
    const jwtService = {
      verifyAsync: jest.fn().mockRejectedValue(new Error('jwt expired')),
    } as unknown as JwtService;

    const prisma = {} as PrismaService;
    const service = new AuthService(jwtService, prisma);

    await expect(
      service.refresh({ refreshToken: 'expired-token' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
