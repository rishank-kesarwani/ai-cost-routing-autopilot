import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async demoLogin(role: 'admin' | 'viewer' = 'admin') {
    const payload = {
      sub: `user-${role}-01`,
      email: `${role}@cost-autopilot.internal`,
      role,
      tenantId: 'tenant-acme',
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '12h',
    });

    return {
      accessToken,
      user: payload,
    };
  }

  async validateUser(payload: any) {
    if (!payload || !payload.sub) {
      throw new UnauthorizedException();
    }
    return payload;
  }
}
