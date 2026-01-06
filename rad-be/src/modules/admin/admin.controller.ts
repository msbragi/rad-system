import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AdminRequired } from 'src/common/decorators/admin-required.decorator';
import { AdminGuard } from 'src/common/guards/admin.guard';
import { User } from '../../common/decorators/user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import {
  AdminUpdateUserRoleDto,
  AdminUpdateUserStatusDto,
  AdminUserListQueryDto,
  AdminCreateUserDto,
  AdminUpdateUserDto
} from '../users/dto/admin-update-user.dto';
import { AdminService } from './admin.service';

@ApiTags('admin')
@ApiBearerAuth('jwt-auth')
@Controller('api/v1/admin')
@UseGuards(JwtAuthGuard)
@UseGuards(AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) { }

  @Get('debug/me')
  @ApiOperation({ summary: 'Debug endpoint to check user data from JWT' })
  @ApiResponse({ status: 200, description: 'User data from JWT token' })

  async debugMe(@User() user: any) {
    return {
      user,
      hasRole: !!user.role,
      isAdmin: user.role === 'admin' || user.role === 'super_user',
      isSuperUser: user.role === 'super_user',
      isDisabled: user.disabled,
    };
  }

  @Get('users')
  @ApiOperation({ summary: 'List all users with filtering and pagination' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  @AdminRequired()  // Both admins and super users can access
  async getUsers(
    @Query() query: AdminUserListQueryDto) {
    return this.adminService.getUsers(query);
  }

  @Patch('users/:id/role')
  @ApiOperation({ summary: 'Update user role - Admin can assign admin role to ordinary users, Super user can assign any role' })
  @ApiResponse({ status: 200, description: 'User role updated successfully' })
  @AdminRequired()  // Both admins and super users can access
  async updateUserRole(
    @User() user: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRoleDto: AdminUpdateUserRoleDto,
  ) {
    // Pass current user context to service for detailed security checks
    return this.adminService.updateUserRole(
      user.userId,
      user.role,
      id,
      updateRoleDto.role === 'user' ? null : updateRoleDto.role
    );
  }

  @Patch('users/:id/status')
  @ApiOperation({ summary: 'Enable or disable user account - Admin can disable ordinary users, Super user can disable anyone' })
  @ApiResponse({ status: 200, description: 'User status updated successfully' })
  @AdminRequired()  // Both admins and super users can access
  async updateUserStatus(
    @User() user: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateStatusDto: AdminUpdateUserStatusDto,
  ) {
    return this.adminService.updateUserStatus(
      user.userId,
      user.role,
      id,
      updateStatusDto.disabled
    );
  }

  @Post('users')
  @ApiOperation({ summary: 'Create a new user - Admin can create regular/admin users, Super user can create any user' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 400, description: 'Email or username already exists' })
  @AdminRequired()  // Both admins and super users can access
  async createUser(
    @User() user: any,
    @Body() createUserDto: AdminCreateUserDto,
  ) {
    return this.adminService.createUser(user.role, createUserDto);
  }

  @Put('users/:id')
  @ApiOperation({ summary: 'Update user details - Admin can update ordinary users, Super user can update anyone' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @AdminRequired()  // Both admins and super users can access
  async updateUser(
    @User() user: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: AdminUpdateUserDto,
  ) {
    return this.adminService.updateUser(
      user.userId,
      user.role,
      id,
      updateUserDto
    );
  }

  @Delete('users/:id')
  @ApiOperation({ summary: 'Delete a user - Admin can delete ordinary users, Super user can delete anyone (except themselves)' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @AdminRequired()  // Both admins and super users can access
  async deleteUser(
    @User() user: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.adminService.deleteUser(user.userId, user.role, id);
  }

}
