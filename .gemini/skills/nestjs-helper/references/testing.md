# NestJS Testing Best Practices

NestJS provides the `@nestjs/testing` package to facilitate unit and integration testing. Always write tests that run in isolation, mocking heavy dependencies (such as TypeORM repositories, external APIs, etc.).

## 1. Unit Testing with Mocks

To unit test a service or controller, create a testing module using `Test.createTestingModule` and mock all external services or repositories.

### Example: Testing `ProductsService` with Mocked Repository

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductsService } from './products.service';
import { Product } from './entities/product.entity';

describe('ProductsService', () => {
  let service: ProductsService;
  let repository: Repository<Product>;

  const mockProductRepository = {
    find: jest.fn(),
    findOneBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: getRepositoryToken(Product),
          useValue: mockProductRepository,
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    repository = module.get<Repository<Product>>(getRepositoryToken(Product));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return all products', async () => {
    const products = [{ id: '1', name: 'Product A' }] as Product[];
    mockProductRepository.find.mockResolvedValue(products);

    const result = await service.findAll();
    expect(result).toEqual(products);
    expect(mockProductRepository.find).toHaveBeenCalled();
  });
});
```

## 2. End-to-End (E2E) Testing

E2E tests verify the entire request-response cycle. Always use `supertest` and make sure to apply the same global pipes, interceptors, or filters used in your real `main.ts` file.

### Example: E2E Test Setup

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    // CRITICAL: Match the main.ts configurations
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      transform: true,
    }));

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/products (GET)', () => {
    return request(app.getHttpServer())
      .get('/products')
      .expect(200)
      .expect((res) => {
        expect(Array.isArray(res.body)).toBe(true);
      });
  });
});
```
