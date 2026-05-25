import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

const demoUser = {
  id: 'user_owner_demo',
  email: 'owner@wysh.test',
  passwordHash: '$2b$10$Mh.YPA29xTZUJmjEbEnaYul7hG1fRXnNWkNwILUKqnkSyLdXHPrcW',
  sellerId: 'seller_demo',
  storeId: 'store_wysh',
  role: 'OWNER' as const,
  permissions: ['catalog:write', 'orders:manage', 'finance:read', 'admin:read'],
};

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

    return this.login({ email: decoded.email, password: 'Password@123' });
  }
}
