import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { SafeUserProfile } from '../auth.types';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): SafeUserProfile => {
    const request = ctx.switchToHttp().getRequest();
    return request.user; // Assumes the user object is attached to the request by an AuthGuard
  },
);
