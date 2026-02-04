import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RadConfig } from './entities/config.entity';
import { RadConfigController } from './config.controller';
import { RadConfigService } from './config.service';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([RadConfig])],
  controllers: [RadConfigController],
  providers: [RadConfigService],
  exports: [RadConfigService], // Esportiamo il servizio per poterlo usare in altri moduli
})
export class RadConfigModule {}
