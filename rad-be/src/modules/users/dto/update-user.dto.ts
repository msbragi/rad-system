import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';
import { IsEmail, IsString, IsOptional, IsNumber } from 'class-validator';

export class UpdateUserDto extends PartialType(CreateUserDto) {
    
    @ApiProperty({ required: true })
    @IsEmail()
    email: string;

    @ApiProperty({ required: true })
    @IsString()
    @IsOptional()
    fullName?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    avatar?: string;

    @ApiProperty({ required: false, description: 'Bitmask SSO provider (null=local, 2=ldap, 4=google, ...)' })
    @IsOptional()
    @IsNumber()
    ssoMask?: number;

}
