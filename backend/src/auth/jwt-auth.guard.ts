import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from './public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If the route is public, skip authentication
    if (isPublic) {
      return true;
    }

    // Ensure the result of super.canActivate() is a boolean or Promise<boolean>
    const result = await super.canActivate(context);
    
    // If it's Observable<boolean>, convert it to a Promise
    return result as boolean;
  }
}