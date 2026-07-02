import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshDto {
  @ApiProperty({
    description: 'El Refresh Token de JWT emitido durante el login',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyYmY3Y...',
  })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
