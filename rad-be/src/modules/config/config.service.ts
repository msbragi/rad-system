import { Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseService } from '../../common/services/base.service';
import { UpdateConfigDto } from './dto/update-config.dto';
import { RadConfig } from './entities/config.entity';
import { ConfigKey } from './interfaces/config.interfaces';

@Injectable()
export class RadConfigService extends BaseService<RadConfig> implements OnModuleInit {
  private readonly logger = new Logger(RadConfigService.name);
  private readonly configCache = new Map<string, any>();

  constructor(
    @InjectRepository(RadConfig)
    private readonly ragConfigRepository: Repository<RadConfig>,
    private readonly nestConfigService: NestConfigService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    super(ragConfigRepository);
  }

  async onModuleInit() {
    this.logger.log('Initializing configuration from database...');
    await this.loadAllConfigIntoCache();
  }

  async loadAllConfigIntoCache(): Promise<void> {
    const allConfigs = await this.findAll();
    this.configCache.clear();

    console.log(`[DEBUG RagConfigService] Starting cache load from DB... Found ${allConfigs.length} total entries.`);

    allConfigs.forEach(config => {
      // Store the full object
      this.configCache.set(config.key, config.value);
      console.log(`[DEBUG RagConfigService] Stored main key: "${config.key}" (isEnvValue: ${config.isEnvValue})`);

      // If isEnvValue is true, flatten the object
      if (config.isEnvValue && typeof config.value === 'object' && config.value !== null && !Array.isArray(config.value)) {
        console.log(`[DEBUG RagConfigService] Flattening sparse values for: "${config.key}"`);

        for (const subKey in config.value) {
          if (Object.prototype.hasOwnProperty.call(config.value, subKey)) {
            if (!this.configCache.has(subKey)) {
              this.configCache.set(subKey, config.value[subKey]);
            }
          }
        }
      }
    });
    this.logger.log(`Loaded ${this.configCache.size} configuration entries (including sparse) into cache.`);
    
    // Emit config reload event
    this.eventEmitter.emit('config.reloaded');
  }

  /**
   * Gets a configuration value.
   * It prioritizes the database cache (including flattened sparse values if isEnvValue was true) and falls back to the .env file.
   * @param key The key of the configuration to retrieve.
   * @returns The configuration value, or undefined if not found.
   */
  public get<T>(key: string | ConfigKey, defaultValue?: any): T {
    // 1. Cerca nella cache del database (valori strutturati come oggetti o flattened sparse values)
    if (this.configCache.has(key)) {
      return this.configCache.get(key) as T;
    }

    // 2. Fallback: cerca nel ConfigService di NestJS (variabili del .env)
    const envValue = this.nestConfigService.get<T>(key);
    if (envValue !== undefined) {
      return envValue;
    }

    this.logger.warn(`Configuration key "${key}" not found in database cache or .env file.`);
    return defaultValue ?? undefined;
  }

  async findOneOrFail(key: string): Promise<RadConfig> {
    const config = await this.ragConfigRepository.findOne({ where: { key } });
    if (!config) {
      throw new NotFoundException(`Configuration with key "${key}" not found`);
    }
    return config;
  }

  async update(key: string, updateDto: UpdateConfigDto): Promise<RadConfig> {
    const entity = await this.findOneOrFail(key);

    // FIX: Use Object.assign to preserve the key order from the DTO's 'value' property.
    // Do not use repository.merge() as it reorders keys.
    Object.assign(entity, updateDto);

    // Refresh cache after update
    const savedConfig = await this.ragConfigRepository.save(entity);
    await this.loadAllConfigIntoCache(); // Ensure cache is consistent
    return savedConfig;
  }

  async remove(key: string): Promise<void> {
    const result = await this.ragConfigRepository.delete(key);
    if (result.affected === 0) {
      throw new NotFoundException(`Configuration with key "${key}" not found`);
    }
    // Refresh cache after remove
    await this.loadAllConfigIntoCache(); // Ensure cache is consistent
  }

  protected async checkOwnership(id: number, userId: number): Promise<boolean> {
    return true;
  }
}