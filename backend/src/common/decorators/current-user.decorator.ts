import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    
    console.log('CurrentUser decorator - authHeader:', authHeader);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('CurrentUser decorator - returning anonymous (no auth header)');
      return 'anonymous';
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    console.log('CurrentUser decorator - token:', token.substring(0, 20) + '...');
    
    try {
      // Get JWT secret from environment
      const jwtSecret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
      
      const jwtService = new JwtService({
        secret: jwtSecret,
      });
      
      const payload = jwtService.verify(token);
      console.log('CurrentUser decorator - payload:', payload);
      return payload.sub || 'anonymous';
    } catch (error) {
      console.log('CurrentUser decorator - error verifying token:', error.message);
      // Token is invalid or expired, return anonymous
      return 'anonymous';
    }
  },
);
