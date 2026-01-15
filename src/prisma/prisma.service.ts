import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('✅ Conectado a la base de datos');
    } catch (error) {
      this.logger.error('❌ Error conectando a la base de datos:', error);
      this.logger.error('Verifica que:');
      this.logger.error('1. PostgreSQL esté corriendo');
      this.logger.error('2. DATABASE_URL esté configurado en .env');
      this.logger.error('3. La base de datos exista');
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

