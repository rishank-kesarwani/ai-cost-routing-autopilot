import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';

export class LoginDto {
  role?: 'admin' | 'viewer';
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login or issue demo operator token' })
  async login(@Body() body: LoginDto) {
    const result = await this.authService.demoLogin(body.role || 'admin');
    return {
      success: true,
      data: result,
    };
  }
}
