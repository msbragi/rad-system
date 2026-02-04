import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { IsStringOrObject } from 'src/common/decorators/is-string-or-object.decorator';
import { IConfig } from '../interfaces/config.interfaces';

export class CreateConfigDto implements IConfig {
  @IsString()
  @IsNotEmpty()
  key: string;

  @IsString()
  @IsOptional()
  description: string;

  @IsBoolean()
  @IsOptional()
  isEnvValue: boolean;

  @IsStringOrObject()
  @IsNotEmpty()
  value: string | object;
}
