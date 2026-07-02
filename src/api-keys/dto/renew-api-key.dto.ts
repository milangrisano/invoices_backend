import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RenewApiKeyDto {
  @ApiProperty({
    description: 'Nueva duración o fecha de expiración para la clave de API ("30d", "90d", "1y" o formato ISO)',
    example: '90d',
  })
  @IsString()
  @IsNotEmpty()
  expiresIn: string; // "30d", "90d", "1y" or ISO string
}
