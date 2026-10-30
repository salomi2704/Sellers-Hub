import { AuthService } from './auth.service';
import { UnauthorizedException } from '@nestjs/common';
import {
  CreateResetPasswordDto,
  ResetPasswordDto,
} from './dto/reset-password.dto';

describe('AuthService', () => {
  let service: AuthService;

  // Properly typed mock JWT service
  const mockJwtService = {
    signAsync: () => 'mock-token',
    verifyAsync: (token: string) => {
      if (token === 'valid-reset-token') {
        return {
          sub: 'user_owner_demo',
          email: 'owner@wysh.test',
          type: 'reset',
        };
      }
      if (token === 'valid-refresh-token') {
        return {
          sub: 'user_owner_demo',
          email: 'owner@wysh.test',
          sellerId: 'seller_demo',
          storeId: 'store_wysh',
          role: 'OWNER',
          permissions: [
            'catalog:write',
            'orders:manage',
            'finance:read',
            'admin:read',
          ],
          type: 'refresh',
        };
      }
      if (token === 'valid-access-token') {
        return {
          sub: 'user_owner_demo',
          email: 'owner@wysh.test',
          type: 'access',
        };
      }
      return null;
    },
  } as const;

  beforeEach(() => {
    service = new AuthService(
      mockJwtService as unknown as import('@nestjs/jwt').JwtService,
    );

    (service as any).resetTokens = new Map();
  });

  describe('login', () => {
    it('should login with correct credentials', async () => {
      const result = await service.login({
        email: 'owner@wysh.test',
        password: 'Password@123',
      });

      expect(result).toBeDefined();
      expect(result.user.email).toBe('owner@wysh.test');
      expect(result.user.sellerId).toBe('seller_demo');
      expect(result.user.role).toBe('OWNER');
    });

    it('should throw UnauthorizedException with wrong password', async () => {
      await expect(
        service.login({ email: 'owner@wysh.test', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException with wrong email', async () => {
      await expect(
        service.login({ email: 'wrong@test.com', password: 'Password@123' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refresh', () => {
    it('should rotate refresh token and issue new access token', async () => {
      const result = await service.refresh({
        refreshToken: 'valid-refresh-token',
      });

      expect(result).toBeDefined();
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.user.email).toBe('owner@wysh.test');
    });

    it('should throw UnauthorizedException when token type is not refresh', async () => {
      await expect(
        service.refresh({ refreshToken: 'valid-access-token' } as any),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('forgotPassword', () => {
    it('should generate reset token for registered email', async () => {
      const dto: CreateResetPasswordDto = { email: 'owner@wysh.test' };
      const result = await service.forgotPassword(dto);

      expect(result).toBeDefined();
      expect(result.sent).toBe(true);
      expect(result.resetToken).toBeDefined();
    });

    it('should return not-found for unregistered email', async () => {
      const dto: CreateResetPasswordDto = { email: 'notfound@test.com' };
      const result = await service.forgotPassword(dto);

      expect(result.sent).toBe(false);
      expect(result.reason).toBe('Email not found in demo tenant.');
    });
  });

  describe('resetPassword', () => {
    it('should reset password with valid token', async () => {
      const dto: CreateResetPasswordDto = { email: 'owner@wysh.test' };
      const resetToken = await service.forgotPassword(dto);

      const result = await service.resetPassword({
        resetToken: resetToken.resetToken,
        newPassword: 'NewPassword@123',
      } as ResetPasswordDto);

      expect(result.success).toBe(true);
    });

    it('should throw UnauthorizedException when token already used', async () => {
      const dto: CreateResetPasswordDto = { email: 'owner@wysh.test' };
      const resetToken = await service.forgotPassword(dto);

      await service.resetPassword({
        resetToken: resetToken.resetToken,
        newPassword: 'NewPassword@123',
      } as ResetPasswordDto);

      await expect(
        service.resetPassword({
          resetToken: resetToken.resetToken,
          newPassword: 'AnotherPassword@123',
        } as ResetPasswordDto),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when token expired', async () => {
      const dto: CreateResetPasswordDto = { email: 'owner@wysh.test' };

      // Populate the resetTokens map then overwrite with expired entry
      await service.forgotPassword(dto);

      (service as any).resetTokens.set('expired-token-' + Date.now(), {
        userId: 'user_owner_demo',
        expiresAt: Date.now() - 100000,
        used: false,
      });

      await expect(
        service.resetPassword({
          resetToken: 'expired-token-' + Date.now(),
          newPassword: 'NewPassword@123',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
