import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { AdminRequired } from 'src/common/decorators/admin-required.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { CreateConfigDto } from './dto/create-config.dto';
import { UpdateConfigDto } from './dto/update-config.dto';
import { RadConfig } from './entities/config.entity';
import { RadConfigService } from './config.service';

@ApiTags('configuration')
@Controller('api/v1/admin/config')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('jwt-auth')
export class RadConfigController {
  constructor(private readonly radConfigService: RadConfigService) {}

  @Post('reload')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Force reload of configuration cache from DB' })
  @AdminRequired()
  async reloadConfig() {
    await this.radConfigService.loadAllConfigIntoCache();
    return { success: true, message: 'Configuration cache reloaded' };
  }

  @Post()
  @ApiOperation({ summary: 'Create a new configuration entry' })
  @ApiBody({ type: CreateConfigDto })
  create(@Body() createRagConfigDto: CreateConfigDto): Promise<RadConfig> {
    return this.radConfigService.create(createRagConfigDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all configuration entries' })
  findAll(): Promise<RadConfig[]> {
    return this.radConfigService.findAll();
  }

  @Get(':key')
  @ApiOperation({ summary: 'Get a configuration entry by key' })
  @ApiParam({ name: 'key', description: 'The key of the configuration entry' })
  findOne(@Param('key') key: string): Promise<RadConfig> {
    return this.radConfigService.findOneOrFail(key);
  }

  @Put(':key')
  @ApiOperation({ summary: 'Update a configuration entry' })
  @ApiParam({ name: 'key', description: 'The key of the configuration to update' })
  @ApiBody({ type: UpdateConfigDto })
  update(
    @Param('key') key: string,
    @Body() updateRagConfigDto: UpdateConfigDto,
  ): Promise<RadConfig> {
    return this.radConfigService.update(key, updateRagConfigDto);
  }

  @Delete(':key')
  @ApiOperation({ summary: 'Delete a configuration entry' })
  @ApiParam({ name: 'key', description: 'The key of the configuration to delete' })
  remove(@Param('key') key: string): Promise<void> {
    return this.radConfigService.remove(key);
  }
}
