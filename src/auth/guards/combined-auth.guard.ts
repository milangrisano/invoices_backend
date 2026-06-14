import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiKeysService } from '../../api-keys/api-keys.service';

@Injectable()
export class CombinedAuthGuard implements CanActivate {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // 1. Try API Key Authentication (x-api-key or Authorization: ApiKey <key>)
    let apiKey = request.headers['x-api-key'];
    const authHeader = request.headers['authorization'];

    if (!apiKey && authHeader && authHeader.startsWith('ApiKey ')) {
      apiKey = authHeader.substring(7);
    }

    if (apiKey) {
      const user = await this.apiKeysService.validate(apiKey);
      if (user) {
        request.user = user;
        request.authType = 'api-key';
        return true;
      }
    }

    // 2. Fallback to Passport JWT Authentication Guard
    const jwtGuard = new (class extends AuthGuard('jwt') {})();
    try {
      const canActivateJwt = await jwtGuard.canActivate(context);
      if (canActivateJwt) {
        request.authType = 'jwt';
        return true;
      }
    } catch (error) {
      // Catch passport errors to throw custom unauthorized exception
    }

    throw new UnauthorizedException('Access denied. A valid JWT token or API Key is required.');
  }
}
