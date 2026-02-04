import { BadRequestException, GoneException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from 'src/modules/users/entities/user.entity';
import { EmailService } from '../email/email.service';
import { UsersService } from '../users/services/users.service';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { SsoService } from './sso-providers/sso.service';

@Injectable()
export class AuthService {
  //private readonly googleClient: OAuth2Client;

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private ssoService: SsoService,
    private configService: ConfigService,
    private emailService: EmailService,
  ) {
    //this.googleClient = new OAuth2Client(this.configService.get<string>('GOOGLE_CLIENT_ID'));
  }

  async validateUser(emailOrUsername: string, password: string): Promise<User | null> {
    // Prova autenticazione SSO (LDAP, ecc.)
    const ssoUserData = await this.ssoService.authenticate(emailOrUsername, password);

    if (ssoUserData) {
      // Crea o aggiorna l'utente nel DB (upsert)
      const user = await this.usersService.upsertFromSso(ssoUserData, password);
      return user;
    }

    const user = await this.usersService.findByEmailOrUsername(emailOrUsername);

    // Check if user exists and has password
    if (!user?.password) return null;

    // Validate password using BaseService method
    const isValid = await this.usersService.comparePasswords(password, user.password);
    if (!isValid) return null;

    // Return the user entity (password will be excluded by select: false in entity)
    return user;
  }

  async login(loginDto: LoginDto) {
    const emailOrUsername = loginDto.email || loginDto.username;
    const user = await this.validateUser(emailOrUsername, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.generateAuthResponse(user);
  }

  async forgotPassword(email: string, language?: string) {
    // Check if user exists
    const user = await this.usersService.findByEmailOrUsername(email);
    if (!user) {
      // We don't want to reveal if the email exists or not for security reasons
      return {
        status: 'success',
        message: 'If your email exists in our system, you will receive a password reset link'
      };
    }

    try {
      // Generate reset token
      const resetToken = this.jwtService.sign(
        {
          email: user.email,
          type: 'password_reset',
          language: language || 'en',
        },
        { expiresIn: '1h' } // shorter expiration for security
      );

      // Update user with reset token
      await this.usersService.update(user.id, {
        pwdResetToken: resetToken,
        pwdResetExpires: new Date(Date.now() + 3600000) // 1 hour from now
      });

      // Send password reset email
      await this.emailService.sendPasswordResetEmail(
        user.email,
        resetToken,
        language || 'it'
      );

      return {
        status: 'success',
        message: 'If your email exists in our system, you will receive a password reset link'
      };
    } catch (error) {
      console.error('Password reset error:', error);
      // Still return success response to prevent email enumeration attacks
      return {
        status: 'success',
        message: 'If your email exists in our system, you will receive a password reset link'
      };
    }
  }

  async resetPassword(token: string, newPassword: string) {
    try {
      // Verify token validity
      const decoded = this.jwtService.verify(token);
      const { email, type } = decoded;

      // Ensure it's a password reset token
      if (type !== 'password_reset') {
        throw new BadRequestException('Invalid token type');
      }

      const user = await this.usersService.findByEmailOrUsername(email);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Verify token matches and hasn't expired
      if (user.pwdResetToken !== token) {
        throw new BadRequestException('Invalid reset token');
      }

      if (!user.pwdResetExpires || new Date() > user.pwdResetExpires) {
        throw new GoneException('Reset token expired');
      }

      // Update password
      await this.usersService.update(user.id, {
        password: newPassword, // BaseService will hash this
        pwdResetToken: null,
        pwdResetExpires: null
      });

      return {
        status: 'success',
        message: 'Password reset successfully'
      };

    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new GoneException('Reset link expired');
      }
      // Re-throw the error if it's one of our custom exceptions
      if (error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof GoneException) {
        throw error;
      }
      // For any other error, throw a generic bad request
      throw new BadRequestException('Failed to reset password');
    }
  }

  // Add this after your other methods

  /**
   * Refreshes an access token using a valid refresh token
   * @param refreshToken The refresh token to validate
   * @returns A new access token
   */
  async refreshToken(refreshToken: string) {
    try {
      // Verify the refresh token
      const decoded = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_SECRET')
      });

      // Check if the decoded token has the expected fields
      if (!decoded.email || !decoded.sub) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Check if the user still exists
      const user = await this.usersService.findById(decoded.sub);
      if (!user) {
        throw new UnauthorizedException('User no longer exists');
      }

      // Generate a new access token with complete payload using centralized method
      const payload = this.buildJwtPayload(user);
      const newAccessToken = this.jwtService.sign(payload, {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: this.configService.get<any>('JWT_EXPIRES_IN', '15m'),
      });

      return {
        access_token: newAccessToken
      };
    } catch (error) {
      // If token verification fails or other errors occur
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /**
   * Build JWT payload with all necessary user fields
   * This ensures consistency across login, refresh, and other JWT operations
   * @param user User entity with complete data
   * @returns JwtPayload with all required fields
   */
  private buildJwtPayload(user: User): JwtPayload {
    return {
      email: user.email,
      sub: user.id,
      role: user.role,
      ssoMask: user.ssoMask,
      disabled: user.disabled,
      // Add any new fields here and they'll be automatically included everywhere
    };
  }

  /**
   * Generate a complete authentication response with access and refresh tokens
   * @param user User entity
   * @returns Object containing access_token, refresh_token, and user data
   */
  private generateAuthResponse(user: User) {
    const payload = this.buildJwtPayload(user);

    // Generate access token (short-lived)
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: this.configService.get<any>('JWT_EXPIRES_IN', '15m'),
    });

    // Generate refresh token (long-lived)
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: this.configService.get<any>('JWT_REFRESH_EXPIRATION', '7d'),
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        avatar: user.avatar,
      }
    };
  }
}