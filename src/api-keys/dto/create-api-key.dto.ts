import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateApiKeyDto {
  @ApiProperty({
    description: 'Nombre identificativo para la Clave de API',
    example: 'Herb Automation Key',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Descripción del propósito de esta clave (opcional)',
    example: 'Utilizada por Herb para ingresar productos automáticamente',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Duración o fecha de expiración de la clave ("30d", "90d", "1y" o formato ISO)',
    example: '1y',
  })
  @IsString()
  @IsNotEmpty()
  expiresIn: string; // "30d", "90d", "1y" or ISO string
}
