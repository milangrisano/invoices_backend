import { Injectable, OnModuleInit, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { ApiKey } from './entities/api-key.entity';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';

@Injectable()
export class ApiKeysService implements OnModuleInit {
  constructor(
    @InjectRepository(ApiKey)
    private readonly apiKeyRepository: Repository<ApiKey>,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    const adminEmail = this.configService.get<string>('INITIAL_ADMIN_EMAIL');
    const herbApiKey = this.configService.get<string>('HERB_API_KEY');

    if (!adminEmail || !herbApiKey) {
      return;
    }

    // Find the admin user to associate the key with
    const admin = await this.usersService.findByEmail(adminEmail);
    if (!admin) {
      return;
    }

    const keyHash = this.hashKey(herbApiKey);
    const existingKey = await this.apiKeyRepository.findOne({ where: { keyHash } });

    if (!existingKey) {
      // Herb's key expires in 1 year
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);

      const apiKeyEntity = this.apiKeyRepository.create({
        name: 'Herb Automation Key',
        description: 'Auto-generated key for Herb automated product entry',
        keyHash,
        expiresAt,
        user: admin,
      });

      await this.apiKeyRepository.save(apiKeyEntity);
      console.log('[SEED] Initial API Key for Herb registered successfully.');
    }
  }

  private hashKey(key: string): string {
    return crypto.createHash('sha256').update(key).digest('hex');
  }

  private parseExpiresIn(expiresIn: string): Date {
    const now = new Date();
    
    // Check if it's a relative days or years expression: "30d", "90d", "1y"
    const daysMatch = expiresIn.match(/^(\d+)d$/);
    if (daysMatch) {
      const days = parseInt(daysMatch[1], 10);
      now.setDate(now.getDate() + days);
      return now;
    }

    const yearsMatch = expiresIn.match(/^(\d+)y$/);
    if (yearsMatch) {
      const years = parseInt(yearsMatch[1], 10);
      now.setFullYear(now.getFullYear() + years);
      return now;
    }

    // Try parsing as ISO string
    const parsedDate = new Date(expiresIn);
    if (!isNaN(parsedDate.getTime())) {
      return parsedDate;
    }

    throw new BadRequestException(
      'Invalid format for expiresIn. Use standard days "30d", "90d", years "1y" or an ISO date string.',
    );
  }

  async generate(
    name: string,
    description: string,
    expiresIn: string,
    creator: User,
  ): Promise<{ plainKey: string; entity: ApiKey }> {
    const plainKey = `inv_key_${crypto.randomBytes(24).toString('hex')}`;
    const keyHash = this.hashKey(plainKey);
    const expiresAt = this.parseExpiresIn(expiresIn);

    const apiKeyEntity = this.apiKeyRepository.create({
      name,
      description,
      keyHash,
      expiresAt,
      user: creator,
    });

    const savedEntity = await this.apiKeyRepository.save(apiKeyEntity);

    return {
      plainKey,
      entity: savedEntity,
    };
  }

  async validate(key: string): Promise<User | null> {
    const keyHash = this.hashKey(key);
    const apiKey = await this.apiKeyRepository.findOne({
      where: { keyHash, isActive: true },
      relations: { user: true },
    });

    if (!apiKey) {
      return null;
    }

    // Check expiration date
    if (apiKey.expiresAt < new Date()) {
      return null;
    }

    return apiKey.user;
  }

  async list(): Promise<ApiKey[]> {
    // List all active keys, omitting the sensitive hash
    return this.apiKeyRepository.find({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        description: true,
        expiresAt: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      relations: { user: true },
    });
  }

  async revoke(id: string): Promise<ApiKey> {
    const apiKey = await this.apiKeyRepository.findOneBy({ id });
    if (!apiKey) {
      throw new NotFoundException(`API Key with ID "${id}" not found`);
    }

    apiKey.isActive = false; // Logical revocation to preserve integrity
    return this.apiKeyRepository.save(apiKey);
  }

  async renew(id: string, expiresIn: string): Promise<ApiKey> {
    const apiKey = await this.apiKeyRepository.findOneBy({ id });
    if (!apiKey) {
      throw new NotFoundException(`API Key with ID "${id}" not found`);
    }

    apiKey.expiresAt = this.parseExpiresIn(expiresIn);
    apiKey.isActive = true; // Ensure it's active when renewed
    return this.apiKeyRepository.save(apiKey);
  }
}
