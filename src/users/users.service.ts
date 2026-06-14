import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
  ) {}

  // Automatically seed the initial admin when the module initializes
  async onModuleInit() {
    const adminEmail = this.configService.get<string>('INITIAL_ADMIN_EMAIL');
    const adminPassword = this.configService.get<string>('INITIAL_ADMIN_PASSWORD');

    if (!adminEmail || !adminPassword) {
      return;
    }

    const existingAdmin = await this.findByEmail(adminEmail);
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      await this.create(adminEmail, hashedPassword, ['admin']);
      console.log(`[SEED] Initial Admin user created successfully: ${adminEmail}`);
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email, isActive: true },
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id, isActive: true },
    });
  }

  async create(email: string, passwordHash: string, roles: string[] = ['user']): Promise<User> {
    const user = this.userRepository.create({
      email,
      password: passwordHash,
      roles,
    });
    return this.userRepository.save(user);
  }
}
