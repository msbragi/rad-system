import { IsString, IsOptional, IsObject } from 'class-validator';
import { CreateConfigDto } from './create-config.dto';
import { PartialType } from '@nestjs/swagger';

export class UpdateConfigDto extends PartialType(CreateConfigDto) {
    
}
