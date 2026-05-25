import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { Permission } from '../common/enums/permission.enum';
import { Role } from '../common/enums/role.enum';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import { PrismaService } from '../infrastructure/prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async login(payload: LoginDto) {
    const user = await this.prisma.user.findFirst({
      where: { email: payload.email, deletedAt: null },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const passwordMatches = await bcrypt.compare(
      payload.password,
      user.passwordHash,
    );
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const claims = this.buildClaims(user);

    const accessToken = await this.jwtService.signAsync(claims);
    const refreshToken = await this.jwtService.signAsync(
      { ...claims, type: 'refresh' },
      { expiresIn: '7d' },
    );

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        sellerId: user.sellerId,
        storeId: user.storeId,
        role: user.role,
        permissions: user.permissions,
      },
    };
  }

  async refresh(payload: RefreshTokenDto) {
    const decoded = await this.jwtService.verifyAsync<JwtPayload>(
      payload.refreshToken,
    );

    if (decoded.type !== 'refresh') {
      throw new UnauthorizedException('Refresh token required.');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: decoded.sub },
    });
    if (!user || user.deletedAt) {
      throw new UnauthorizedException('User not found.');
    }

    const claims = this.buildClaims(user);

    return {
      accessToken: await this.jwtService.signAsync(claims),
      refreshToken: await this.jwtService.signAsync(
        { ...claims, type: 'refresh' },
        { expiresIn: '7d' },
      ),
    };
  }

  private buildClaims(user: User): JwtPayload {
    return {
      sub: user.id,
      email: user.email,
      sellerId: user.sellerId,
      storeId: user.storeId,
      role: user.role as Role,
      permissions: user.permissions as Permission[],
      type: 'access',
    };
  }
}
