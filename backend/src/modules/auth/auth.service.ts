import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../../entities/user.entity';
import { UserSession } from '../../entities/user-session.entity';
import { TokenBlacklist } from '../../entities/token-blacklist.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { LogoutDto } from './dto/logout.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserSession)
    private userSessionRepository: Repository<UserSession>,
    @InjectRepository(TokenBlacklist)
    private tokenBlacklistRepository: Repository<TokenBlacklist>,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<{ user: Partial<User>; tokens: any }> {
    const { email, password, firstName, lastName, companyName } = registerDto;

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = this.userRepository.create({
      email,
      passwordHash,
      firstName,
      lastName,
      companyName,
    });

    const savedUser = await this.userRepository.save(user);

    // Generate tokens
    const tokens = await this.generateTokens(savedUser);

    return {
      user: {
        id: savedUser.id,
        email: savedUser.email,
        firstName: savedUser.firstName,
        lastName: savedUser.lastName,
        companyName: savedUser.companyName,
      },
      tokens,
    };
  }

  async login(loginDto: LoginDto, ipAddress?: string, userAgent?: string): Promise<{ user: Partial<User>; tokens: any }> {
    const { email, password } = loginDto;

    // Find user
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login
    await this.userRepository.update(user.id, { lastLoginAt: new Date() });

    // Generate tokens
    const tokens = await this.generateTokens(user, ipAddress, userAgent);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        companyName: user.companyName,
      },
      tokens,
    };
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto): Promise<{ tokens: any }> {
    const { refreshToken } = refreshTokenDto;

    // Find session by refresh token hash
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    const session = await this.userSessionRepository.findOne({
      where: { refreshTokenHash },
      relations: ['user'],
    });

    if (!session || session.isRevoked || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Generate new tokens
    const tokens = await this.generateTokens(session.user);

    // Update session with new refresh token
    const newRefreshTokenHash = await bcrypt.hash(tokens.refreshToken, 10);
    await this.userSessionRepository.update(session.id, {
      refreshTokenHash: newRefreshTokenHash,
    });

    return { tokens };
  }

  async logout(logoutDto: LogoutDto, userId: string): Promise<void> {
    const { refreshToken } = logoutDto;

    // Find and revoke session
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    const session = await this.userSessionRepository.findOne({
      where: { refreshTokenHash, userId },
    });

    if (session) {
      await this.userSessionRepository.update(session.id, { isRevoked: true });
    }

    // Add access token to blacklist (if provided)
    // This would be implemented when we have the JTI from the access token
  }

  async validateUser(userId: string): Promise<User | null> {
    console.log({
      userId
    })
    return await this.userRepository.findOne({ where: { id: userId } });
  }

  private async generateTokens(user: User, ipAddress?: string, userAgent?: string): Promise<any> {
    const payload = {
      sub: user.id,
      email: user.email,
      jti: uuidv4(), // JWT ID for token tracking
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(
      { sub: user.id },
      { expiresIn: '7d' }
    );

    // Store session
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await this.userSessionRepository.save({
      userId: user.id,
      refreshTokenHash,
      accessTokenJti: payload.jti,
      expiresAt,
      ipAddress,
      userAgent,
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 3600, // 1 hour
    };
  }

  async blacklistToken(jti: string, userId: string, expiresAt: Date): Promise<void> {
    await this.tokenBlacklistRepository.save({
      jti,
      userId,
      expiresAt,
    });
  }

  async isTokenBlacklisted(jti: string): Promise<boolean> {
    const blacklistedToken = await this.tokenBlacklistRepository.findOne({
      where: { jti },
    });
    return !!blacklistedToken;
  }
}
