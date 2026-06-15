import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { RefreshToken } from './entities/refresh-token.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
  ) {}

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  async login(email: string, passwordPlano: string): Promise<{ accessToken: string; refreshToken: string; user: any }> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password with bcrypt
    const isPasswordValid = await bcrypt.compare(passwordPlano, user.password || '');
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate token pair
    const tokens = await this.generateTokenPair(user);

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        roles: user.roles,
      },
    };
  }

  async refresh(plainRefreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      // 1. Verify token signature and integrity
      const payload = this.jwtService.verify(plainRefreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      // 2. Hash and lookup in database
      const tokenHash = this.hashToken(plainRefreshToken);
      const storedToken = await this.refreshTokenRepository.findOne({
        where: { tokenHash, isActive: true },
        relations: { user: true },
      });

      if (!storedToken || storedToken.expiresAt < new Date()) {
        throw new UnauthorizedException('Invalid or expired refresh token');
      }

      // 3. Token Rotation (Invalidate old token)
      storedToken.isActive = false;
      await this.refreshTokenRepository.save(storedToken);

      // 4. Generate new pair
      return await this.generateTokenPair(storedToken.user);
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async logout(plainRefreshToken: string): Promise<{ message: string }> {
    try {
      const tokenHash = this.hashToken(plainRefreshToken);
      const storedToken = await this.refreshTokenRepository.findOneBy({ tokenHash });

      if (storedToken) {
        storedToken.isActive = false;
        await this.refreshTokenRepository.save(storedToken);
      }
    } catch (error) {
      // Fail silently to prevent session tracing
    }

    return { message: 'Logged out successfully' };
  }

  private async generateTokenPair(user: User): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = { sub: user.id, email: user.email, roles: user.roles };

    const accessToken = this.jwtService.sign(payload);

    // Refresh token has separate secret and longer expiration (default 7 days)
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRATION', '7d') as any,
    });

    // Save refresh token hash to DB
    const tokenHash = this.hashToken(refreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Default to 7 days from now

    const refreshTokenEntity = this.refreshTokenRepository.create({
      tokenHash,
      expiresAt,
      user,
    });

    await this.refreshTokenRepository.save(refreshTokenEntity);

    return {
      accessToken,
      refreshToken,
    };
  }
}
