import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import {
  CreateResetPasswordDto,
  ResetPasswordDto,
} from './dto/reset-password.dto';

const demoUser = {
  id: 'user_owner_demo',
  email: 'owner@wysh.test',
  passwordHash: '$2b$10$Mh.YPA29xTZUJmjEbEnaYul7hG1fRXnNWkNwILUKqnkSyLdXHPrcW',
  sellerId: 'seller_demo',
  storeId: 'store_wysh',
  role: 'OWNER' as const,
  permissions: ['catalog:write', 'orders:manage', 'finance:read', 'admin:read'],
};

const resetTokens = new Map<
  string,
  { userId: string; expiresAt: number; used: boolean }
>();

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  async login(payload: LoginDto) {
    const passwordMatches = await bcrypt.compare(
      payload.password,
      demoUser.passwordHash,
    );

    if (!passwordMatches || payload.email !== demoUser.email) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const accessToken = await this.jwtService.signAsync({
      sub: demoUser.id,
      email: demoUser.email,
      sellerId: demoUser.sellerId,
      storeId: demoUser.storeId,
      role: demoUser.role,
      permissions: demoUser.permissions,
      type: 'access',
    });
    const refreshToken = await this.jwtService.signAsync(
      {
        sub: demoUser.id,
        email: demoUser.email,
        sellerId: demoUser.sellerId,
        storeId: demoUser.storeId,
        role: demoUser.role,
        permissions: demoUser.permissions,
        type: 'refresh',
      },
      { expiresIn: '7d' },
    );

    return {
      accessToken,
      refreshToken,
      user: {
        email: demoUser.email,
        sellerId: demoUser.sellerId,
        storeId: demoUser.storeId,
        role: demoUser.role,
        permissions: demoUser.permissions,
      },
    };
  }

  async forgotPassword(payload: CreateResetPasswordDto) {
    const email = payload.email;

    if (email !== demoUser.email) {
      return { sent: false, reason: 'Email not found in demo tenant.' };
    }

    const resetToken = await this.jwtService.signAsync(
      {
        sub: demoUser.id,
        email: demoUser.email,
        type: 'reset',
      },
      { expiresIn: '15m' },
    );

    resetTokens.set(resetToken, {
      userId: demoUser.id,
      expiresAt: Date.now() + 15 * 60 * 1000,
      used: false,
    });

    return { sent: true, resetToken };
  }

  async resetPassword(payload: ResetPasswordDto) {
    const resetEntry = resetTokens.get(payload.resetToken);

    if (!resetEntry) {
      throw new UnauthorizedException('Invalid or expired reset token.');
    }

    if (resetEntry.used) {
      throw new UnauthorizedException('Reset token already used.');
    }

    if (Date.now() > resetEntry.expiresAt) {
      resetTokens.delete(payload.resetToken);
      throw new UnauthorizedException('Reset token has expired.');
    }

    const newPasswordHash = await bcrypt.hash(payload.newPassword, 10);
    demoUser.passwordHash = newPasswordHash;
    resetEntry.used = true;
    resetTokens.delete(payload.resetToken);

    return { success: true };
  }

  async refresh(payload: RefreshTokenDto) {
    const decoded = await this.jwtService.verifyAsync<{
      type: 'access' | 'refresh';
      email: string;
      sellerId: string;
      storeId: string;
      role: typeof demoUser.role;
      permissions: string[];
      sub: string;
    }>(payload.refreshToken);

    if (decoded.type !== 'refresh') {
      throw new UnauthorizedException('Refresh token required.');
    }

    const accessToken = await this.jwtService.signAsync({
      sub: decoded.sub,
      email: decoded.email,
      sellerId: decoded.sellerId,
      storeId: decoded.storeId,
      role: decoded.role,
      permissions: decoded.permissions,
      type: 'access',
    });

    const newRefreshToken = await this.jwtService.signAsync(
      {
        sub: decoded.sub,
        email: decoded.email,
        sellerId: decoded.sellerId,
        storeId: decoded.storeId,
        role: decoded.role,
        permissions: decoded.permissions,
        type: 'refresh',
      },
      { expiresIn: '7d' },
    );

    resetTokens.delete(payload.refreshToken);

    return {
      accessToken,
      refreshToken: newRefreshToken,
      user: {
        email: decoded.email,
        sellerId: decoded.sellerId,
        storeId: decoded.storeId,
        role: decoded.role,
        permissions: decoded.permissions,
      },
    };
  }
}
