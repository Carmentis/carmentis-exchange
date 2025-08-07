import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthService } from '../auth.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { Request } from 'express';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if the route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If the route is public, allow access
    if (isPublic) {
      return true;
    }

    // Get the request object
    const request = context.switchToHttp().getRequest<Request>();
    
    // Extract the token from the Authorization header
    const token = this.extractTokenFromHeader(request);
    
    // If no token is provided, deny access
    if (!token) {
      throw new UnauthorizedException('No token provided');
    }
    
    try {
      // Validate the token and get the public key
      const publicKey = await this.authService.validateToken(token);
      
      // Add the public key to the request object for use in controllers
      request['publicKey'] = publicKey;
      
      // Allow access
      return true;
    } catch (error) {
      // If token validation fails, deny access
      throw new UnauthorizedException('Invalid token');
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}