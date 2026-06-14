---
name: nestjs-helper
description: Specialized helper for NestJS development. Use when creating, refactoring, or testing NestJS applications, implementing modules, controllers, providers, guards, interceptors, pipes, or writing unit/e2e tests with Jest.
---

# NestJS Helper

An expert guide for architecting, developing, and testing NestJS applications according to official NestJS conventions.

## 1. Modular Architecture

NestJS organizes code into cohesive modules. Every domain or feature should reside in its own folder and register with a Module.

### Folder Structure Convention

```text
src/
├── app.module.ts             # Root module
├── main.ts                   # Entry point (ValidationPipe, Helmet, Swagger, etc.)
└── products/                 # Example feature folder
    ├── dto/                  # Data Transfer Objects (DTOs)
    │   ├── create-product.dto.ts
    │   └── update-product.dto.ts
    ├── entities/             # Database Entities (TypeORM/Prisma)
    │   └── product.entity.ts
    ├── products.controller.ts
    ├── products.module.ts
    └── products.service.ts
```

### Module Registration Example

- Always group related Controllers and Providers inside their parent module.
- Always export Providers that need to be used by other modules.

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { Product } from './entities/product.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Product])],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService], // Export if other modules (like Orders) require this service
})
export class ProductsModule {}
```

---

## 2. Dependency Injection (DI) Best Practices

Always prefer constructor-based Dependency Injection rather than manual instantiation or property-based injection.

- **Standard Injection (Constructor)**:
  ```typescript
  constructor(private readonly productsService: ProductsService) {}
  ```
- **String/Symbol Tokens**: Use `@Inject('TOKEN_NAME')` only when injecting non-class-based providers (e.g., custom configuration constants, database connections).

---

## 3. Reference Guides

This skill separates detailed NestJS topics into specialized reference files to keep context usage efficient. Read these files when performing related tasks:

- **CLI Automation**: See [cli.md](references/cli.md) for how to generate controllers, services, guards, and full modules instantly.
- **DTOs & Payload Validation**: See [validation-dto.md](references/validation-dto.md) for setting up incoming payload validations and global pipes.
- **Guards, Decorators & Interceptors**: See [guards-decorators.md](references/guards-decorators.md) for custom authentication guards, `@Public()`, and `@CurrentUser()` decorators.
- **Testing Patterns**: See [testing.md](references/testing.md) for setting up isolated unit tests using Jest mocks and executing E2E integrations.
- **TypeORM & Referential Integrity**: See [typeorm.md](references/typeorm.md) for database entities, relationships, repository patterns, and logical inactivation (soft-delete) strategies.
