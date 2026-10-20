import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  Inject,
  Post,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service.js';
import { bearerToken } from './auth.guard.js';
import { Public } from './public.decorator.js';

@Controller('auth')
export class AuthController {
  constructor(@Inject(AuthService) private readonly auth: AuthService) {}
  @Public()
  @Post('login')
  @HttpCode(200)
  @Header('Cache-Control', 'no-store')
  login(@Body() body: unknown, @Req() request: Request) {
    return this.auth.login(
      body,
      request.ip ?? request.socket.remoteAddress ?? 'unknown',
    );
  }
  @Get('session')
  @Header('Cache-Control', 'no-store')
  session(@Req() request: Request) {
    return this.auth.authenticate(bearerToken(request));
  }
  @Post('logout')
  @HttpCode(200)
  logout(@Req() request: Request) {
    return this.auth.logout(bearerToken(request)!, false);
  }
  @Post('logout-all')
  @HttpCode(200)
  logoutAll(@Req() request: Request) {
    return this.auth.logout(bearerToken(request)!, true);
  }
}
