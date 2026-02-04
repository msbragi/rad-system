import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, ValidateIf } from 'class-validator';

export class LoginDto {

  @ApiProperty({example: 'john.doe@example.com', required: false})
  @ValidateIf(o => !o.username)
  @IsEmail()
  email?: string;

  @ApiProperty({example: 'johndoe', required: false})
  @ValidateIf(o => !o.email)
  @IsString()
  username?: string;

  @ApiProperty({example: 'Password123!', required: true})
  @IsString()
  password: string;
}
