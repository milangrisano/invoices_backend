import { IsNotEmpty, IsString } from 'class-validator';

export class RenewApiKeyDto {
  @IsString()
  @IsNotEmpty()
  expiresIn: string; // "30d", "90d", "1y" or ISO string
}
