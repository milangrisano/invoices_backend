# NestJS Guards, Interceptors, and Custom Decorators

Guards, Interceptors, and Custom Decorators are core pillars of the NestJS execution context lifecycle. Use them to manage Authentication, Authorization, Logging, and Metadata parsing.

## 1. Custom Guards and Reflector

Guards implement the `CanActivate` interface. Use `Reflector` to retrieve custom metadata from route handlers or controllers.

### Example: Role-Based Guard

```typescript
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Retrieve allowed roles from the decorator metadata
    const roles = this.reflector.get<string[]>('roles', context.getHandler());
    if (!roles) {
      return true; // No roles defined, public by default
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user; // Set by preceding AuthGuard (JWT)

    return user && roles.some(role => user.roles?.includes(role));
  }
}
```

## 2. Custom Decorators

Custom decorators simplify controller handlers by abstracting request manipulation.

### Example: `@CurrentUser()` Decorator

```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user; // Extracted during authentication guard
  },
);
```

### Usage:

```typescript
@Get('profile')
getProfile(@CurrentUser() user: any) {
  return user;
}
```

## 3. Custom Metadata Helpers

Instead of hardcoding metadata keys, write clean decorator helpers:

```typescript
import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
```
