import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsOptional, IsBoolean, IsNumber } from 'class-validator';
import { IUser } from '../../../common/interfaces/models.interface';

export class CreateUserDto implements Pick<IUser, 'email' | 'username' | 'password' | 'fullName' | 'ssoMask' | 'avatar' | 'verifyToken' | 'departments'> {
    @ApiProperty()
    @IsEmail()
    email: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    username?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    password?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    fullName?: string;


    @ApiProperty({ required: false, description: 'Bitmask SSO provider (null=local, 2=ldap, 4=google, ...)' })
    @IsOptional()
    @IsNumber()
    ssoMask?: number;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    avatar?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    verifyToken?: string;
    
    @ApiProperty({ example: true, required: false })
    @IsBoolean()
    @IsOptional()
    isVerified?: boolean;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    departments?: string;

}
