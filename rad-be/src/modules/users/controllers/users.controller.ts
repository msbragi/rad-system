import { Body, Controller, Delete, Get, NotFoundException, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { User } from '../../../common/decorators/user.decorator';
import { UpdateUserDto } from '../dto/update-user.dto';
import { User as UserEntity } from '../entities/user.entity';
import { UsersService } from '../services/users.service';

@ApiTags('users')
@ApiBearerAuth('jwt-auth')
@UseGuards(JwtAuthGuard)
@Controller('api/v1/users')
export class UsersController {
    constructor(
        private readonly usersService: UsersService
    ) { }

    @Get('count')
    @ApiOperation({ summary: 'Return number of registered users' })
    @ApiResponse({ status: 200 })
    async count() {
        return this.usersService.count();
    }

    @Get('me')
    @ApiOperation({ summary: 'Get logged in user profile' })
    @ApiResponse({ status: 200, type: UserEntity })
    async findOne(@User('userId') userId: number) {
        const user = await this.usersService.findOne(userId);
        if (!user) {
            throw new NotFoundException('User not found');
        }
        return user;
    }

    @Put('me')
    @ApiOperation({ summary: 'Update logged in user' })
    @ApiResponse({ status: 200, type: UserEntity })
    async update(@User('userId') userId: number, @Body() updateUserDto: UpdateUserDto) {
        const updated = await this.usersService.update(userId, updateUserDto);
        if (!updated) {
            throw new NotFoundException('User not found');
        }
        return updated;
    }

    @Delete('me')
    @ApiOperation({ summary: 'Delete logged in user' })
    @ApiResponse({ status: 200 })
    async remove(@User('userId') userId: number) {
        try {
            await this.usersService.remove(userId);
        } catch (error) {
            throw new NotFoundException('Error or User not found');
        }

        return { message: 'User deleted successfully' };
    }

}
