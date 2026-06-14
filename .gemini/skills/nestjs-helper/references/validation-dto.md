# NestJS DTO and Validation Guidelines

NestJS utilizes `class-validator` and `class-transformer` to perform robust incoming request validation. Always define distinct DTOs (Data Transfer Objects) for different HTTP endpoints (e.g., `CreateProductDto`, `UpdateProductDto`).

## 1. Standard Validation Pipe Configuration

To enable automatic schema validation, configure a global `ValidationPipe` in `main.ts`:

```typescript
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,            // Strips any property not defined in the DTO
      forbidNonWhitelisted: true, // Throws error if unexpected properties are sent
      transform: true,            // Automatically converts primitive payloads to their DTO typed equivalents
    }),
  );

  await app.listen(3000);
}
bootstrap();
```

## 2. Standard DTO Definition

Use decorators from `class-validator` to define validation rules. Use `@Type` from `class-transformer` for nested objects or arrays.

```typescript
import { IsString, IsNotEmpty, IsNumber, IsOptional, IsPositive, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class PriceDetailsDto {
  @IsNumber()
  @IsPositive()
  amount: number;

  @IsString()
  @IsNotEmpty()
  currency: string;
}

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => PriceDetailsDto) // Crucial for nested validation parsing
  price: PriceDetailsDto;
}
```

## 3. Update DTO Pattern

Instead of duplicating the creation DTO, use `@nestjs/mapped-types` or `@nestjs/swagger` to inherit properties with optional validation:

```typescript
import { PartialType } from '@nestjs/mapped-types';
import { CreateProductDto } from './create-product.dto';

export class UpdateProductDto extends PartialType(CreateProductDto) {}
```
