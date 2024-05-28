import {
  CanActivate,
  ExecutionContext,
  HttpStatus,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from './decorators/public.decorator';
import { AuthService } from './auth.service';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);
  constructor(
    private authService: AuthService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      this.logger.error({
        action: 'TOKEN_VERIFICATION_FAIL',
        params: { token: token },
        error: { message: 'TOKEN_NOT_FOUND' },
      });

      throw new UnauthorizedException({
        resultCode: HttpStatus.UNAUTHORIZED,
        resultMsg: '사용할 수 없는 토큰입니다.',
      });
    }
    try {
      request.user = await this.authService.verifyJwtToken(token);
    } catch {
      this.logger.error({
        action: 'TOKEN_VERIFICATION_FAIL',
        params: { token: token },
        error: { message: 'INVALID_TOKEN' },
      });

      throw new UnauthorizedException({
        resultCode: HttpStatus.UNAUTHORIZED,
        resultMsg: '사용할 수 없는 토큰입니다.',
      });
    }
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
