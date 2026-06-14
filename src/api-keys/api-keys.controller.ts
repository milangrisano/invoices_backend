import { 
  Controller, 
  Get, 
  Post, 
  Patch, 
  Delete, 
  Body, 
  Param, 
  UseGuards, 
  Req, 
  ParseUUIDPipe,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiKeysService } from './api-keys.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { RenewApiKeyDto } from './dto/renew-api-key.dto';

@Controller('api-keys')
@UseGuards(AuthGuard('jwt'), RolesGuard) // Protect with JWT and Roles guards
@Roles('admin') // Admin-only controller
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Post()
  async create(@Req() req: any, @Body() createApiKeyDto: CreateApiKeyDto) {
    const creator = req.user;
    return this.apiKeysService.generate(
      createApiKeyDto.name,
      createApiKeyDto.description || '',
      createApiKeyDto.expiresIn,
      creator,
    );
  }

  @Get()
  async findAll() {
    return this.apiKeysService.list();
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.apiKeysService.revoke(id);
  }

  @Patch(':id/renew')
  async renew(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() renewApiKeyDto: RenewApiKeyDto,
  ) {
    return this.apiKeysService.renew(id, renewApiKeyDto.expiresIn);
  }
}
