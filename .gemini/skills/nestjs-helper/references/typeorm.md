# NestJS and TypeORM Best Practices

TypeORM is an Object Relational Mapper that integrates natively with NestJS. Use these guidelines to design database entities, maintain referential integrity, and handle repository actions securely.

## 1. Soft Delete / Inactivation Pattern (Integrity)

To preserve referential integrity, avoid using physical SQL `DELETE` queries for critical data (like products or keys). Instead, use a column (e.g., `active: boolean` or `@DeleteDateColumn()`) to perform logical inactivations.

### Example: Product Entity with Active Flag

```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  description?: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column({ default: true })
  isActive: boolean; // Prefer active/inactive boolean over physical deletion

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

---

## 2. Relationships (ManyToOne / OneToMany)

Always specify inverse relationship definitions to ensure TypeORM can load associated data correctly.

### Example: User and ApiKey Relationship

```typescript
// user.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { ApiKey } from './api-key.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @OneToMany(() => ApiKey, (apiKey) => apiKey.user)
  apiKeys: ApiKey[];
}

// api-key.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from './user.entity';

@Entity('api_keys')
export class ApiKey {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  keyHash: string; // Stored as hash (SHA-256 / bcrypt)

  @Column()
  expiresAt: Date;

  @Column({ default: true })
  isActive: boolean;

  @ManyToOne(() => User, (user) => user.apiKeys, { onDelete: 'CASCADE' })
  user: User;
}
```

---

## 3. Injecting Repositories and Logic in Services

Inject repository dependencies using `@InjectRepository(Entity)`. Handle logical inactivations (Soft Deletes) within services.

### Example: Service with Inactivation Logic

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async findAllActive(): Promise<Product[]> {
    return this.productRepository.find({ where: { isActive: true } });
  }

  async create(createProductDto: CreateProductDto): Promise<Product> {
    const product = this.productRepository.create(createProductDto);
    return this.productRepository.save(product);
  }

  // LOGICAL INACTIVATION (Protects Database Referential Integrity)
  async deactivate(id: string): Promise<Product> {
    const product = await this.productRepository.findOneBy({ id });
    if (!product) {
      throw new NotFoundException(`Product with ID "${id}" not found`);
    }
    
    product.isActive = false; // Toggle the active boolean instead of physical delete
    return this.productRepository.save(product);
  }
}
```
