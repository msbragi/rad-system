import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsBoolean, IsOptional, IsString, IsNumber, Min, IsEmail } from 'class-validator';
import { Type } from 'class-transformer';

export class AdminCreateUserDto {
    @ApiProperty({ required: true, description: 'User email address' })
    @IsEmail()
    email: string;

    @ApiProperty({ required: true, description: 'Username' })
    @IsString()
    username: string;

    @ApiProperty({ required: true, description: 'User password' })
    @IsString()
    password: string;

    @ApiProperty({ required: true, description: 'Full name' })
    @IsString()
    fullName: string;

    @ApiProperty({ required: false, enum: ['super_user', 'admin', null], description: 'User role' })
    @IsOptional()
    @IsEnum(['super_user', 'admin', null])
    role?: 'super_user' | 'admin' | null;

    @ApiProperty({ required: false, description: 'Whether the user is disabled', default: false })
    @IsOptional()
    @IsBoolean()
    disabled?: boolean;

    @ApiProperty({ required: false, description: 'Departments (comma-separated)' })
    @IsOptional()
    @IsString()
    departments?: string;

    @ApiProperty({ required: false, description: 'Bitmask SSO provider (null=local, 2=ldap, 4=google, ...)' })
    @IsOptional()
    @IsNumber()
    ssoMask?: number;
}

export class AdminUpdateUserDto {
    @ApiProperty({ required: false, description: 'User email address' })
    @IsOptional()
    @IsEmail()
    email?: string;

    @ApiProperty({ required: false, description: 'Username' })
    @IsOptional()
    @IsString()
    username?: string;

    @ApiProperty({ required: false, description: 'User password (leave empty to keep current)' })
    @IsOptional()
    @IsString()
    password?: string;

    @ApiProperty({ required: false, description: 'Full name' })
    @IsOptional()
    @IsString()
    fullName?: string;

    @ApiProperty({ required: false, description: 'Departments (comma-separated)' })
    @IsOptional()
    @IsString()
    departments?: string;

    @ApiProperty({ required: false, description: 'Bitmask SSO provider (null=local, 2=ldap, 4=google, ...)' })
    @IsOptional()
    @IsNumber()
    ssoMask?: number;
}

export class AdminUpdateUserRoleDto {
    @ApiProperty({ 
        enum: ['super_user', 'admin', 'user', null], 
        description: 'User role - null removes admin privileges',
        required: true 
    })
    @IsEnum(['super_user', 'admin', 'user', null])
    role: 'super_user' | 'admin' | 'user' | null;
}

export class AdminUpdateUserStatusDto {
    @ApiProperty({ 
        description: 'Whether the user account is disabled',
        required: true 
    })
    @IsBoolean()
    disabled: boolean;
}

export class AdminUserListQueryDto {
    @ApiProperty({ required: false, description: 'Page number (starts from 1)' })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    page?: number = 1;

    @ApiProperty({ required: false, description: 'Number of items per page' })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    limit?: number = 20;

    @ApiProperty({ required: false, description: 'Filter by role' })
    @IsOptional()
    @IsEnum(['super_user', 'admin', 'regular'])
    role?: 'super_user' | 'admin' | 'regular';

    @ApiProperty({ required: false, description: 'Filter by status' })
    @IsOptional()
    @IsEnum(['active', 'disabled'])
    status?: 'active' | 'disabled';

    @ApiProperty({ required: false, description: 'Search by email or name' })
    @IsOptional()
    @IsString()
    search?: string;
}
