import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, MinLength } from 'class-validator';

export class CreateProductDto {
  @ApiProperty({
    description: 'Nombre descriptivo del producto',
    example: 'Laptop ASUS ZenBook 14',
    minLength: 2,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2, { message: 'Product name must be at least 2 characters long' })
  name: string;

  @ApiProperty({
    description: 'Descripción del producto (campo opcional)',
    example: 'Intel Core i7, 16GB RAM, 512GB SSD',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Precio de venta del producto en USD (máximo 2 decimales)',
    example: 999.99,
    minimum: 0.01,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive({ message: 'Price must be a positive number' })
  price: number;
}
