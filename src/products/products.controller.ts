import { 
  Controller, 
  Get, 
  Post, 
  Patch, 
  Delete, 
  Body, 
  Param, 
  Query, 
  UseGuards, 
  Req, 
  ForbiddenException, 
  ParseUUIDPipe,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { CombinedAuthGuard } from '../auth/guards/combined-auth.guard';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Controller('products')
@UseGuards(CombinedAuthGuard) // Protect all product endpoints with combined auth (JWT or ApiKey)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  async create(@Req() req: any, @Body() createProductDto: CreateProductDto) {
    const { user, authType } = req;
    
    // Auth Check: Allowed if API Key OR if JWT and user role is admin/editor
    const isAuthorized = authType === 'api-key' || (user && (user.roles?.includes('admin') || user.roles?.includes('editor')));
    if (!isAuthorized) {
      throw new ForbiddenException('Only admins, editors, or external services can create products.');
    }

    return this.productsService.create(createProductDto);
  }

  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const parsedPage = page ? parseInt(page, 10) : 1;
    const parsedLimit = limit ? parseInt(limit, 10) : 10;
    
    return this.productsService.findAll(parsedPage, parsedLimit, search);
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Req() req: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    const { user, authType } = req;

    // Auth Check: Allowed if API Key OR if JWT and user role is admin/editor
    const isAuthorized = authType === 'api-key' || (user && (user.roles?.includes('admin') || user.roles?.includes('editor')));
    if (!isAuthorized) {
      throw new ForbiddenException('Only admins, editors, or external services can update products.');
    }

    return this.productsService.update(id, updateProductDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Req() req: any, @Param('id', ParseUUIDPipe) id: string) {
    const { user, authType } = req;

    // Strict Rule: API Key has no delete permissions for security
    if (authType === 'api-key') {
      throw new ForbiddenException('API Keys do not have delete permissions.');
    }

    // Auth Check: Only admin (JWT) can delete (which soft-deletes/deactivates the product)
    const isAuthorized = user && user.roles?.includes('admin');
    if (!isAuthorized) {
      throw new ForbiddenException('Only administrators can deactivate products.');
    }

    return this.productsService.deactivate(id);
  }
}
