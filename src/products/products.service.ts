import { Injectable, OnModuleInit, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, ILike } from 'typeorm';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService implements OnModuleInit {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  // Automatically seed example products on module initialization
  async onModuleInit() {
    const count = await this.productRepository.count();
    if (count === 0) {
      const defaultProducts = [
        { name: 'Apple iPhone 15', description: 'Flagship smartphone from Apple', price: 999.99 },
        { name: 'Samsung Galaxy S24', description: 'Samsung premium Android device with AI features', price: 899.99 },
        { name: 'MacBook Pro M3', description: 'Powerful laptop for professionals', price: 1999.99 },
        { name: 'Dell XPS 15', description: 'Premium Windows laptop with outstanding display', price: 1599.99 },
        { name: 'Sony WH-1000XM5', description: 'Industry-leading noise cancelling wireless headphones', price: 349.99 },
      ];

      for (const p of defaultProducts) {
        await this.productRepository.save(this.productRepository.create(p));
      }
      console.log('[SEED] Default products seeded successfully.');
    }
  }

  async create(createProductDto: CreateProductDto): Promise<Product> {
    const product = this.productRepository.create(createProductDto);
    return this.productRepository.save(product);
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    search?: string,
  ): Promise<{ data: Product[]; total: number; page: number; limit: number }> {
    const skip = (page - 1) * limit;

    // Use ILike for case-insensitive search if supported (PostgreSQL supports ILike natively)
    const whereCondition: any = { isActive: true };
    if (search) {
      whereCondition.name = ILike(`%${search}%`);
    }

    const [data, total] = await this.productRepository.findAndCount({
      where: whereCondition,
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id, isActive: true },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID "${id}" not found`);
    }

    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto): Promise<Product> {
    const product = await this.findOne(id);
    const updatedProduct = this.productRepository.merge(product, updateProductDto);
    return this.productRepository.save(updatedProduct);
  }

  async deactivate(id: string): Promise<Product> {
    const product = await this.findOne(id);
    product.isActive = false; // Logical deletion to preserve relational integrity
    return this.productRepository.save(product);
  }
}
