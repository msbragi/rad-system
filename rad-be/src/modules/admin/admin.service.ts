import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { AdminUserListQueryDto, AdminCreateUserDto, AdminUpdateUserDto } from '../users/dto/admin-update-user.dto';
import { User } from '../users/entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) { }

  async getUsers(query: AdminUserListQueryDto) {
    const { page = 1, limit = 20, role, status, search } = query;
    const skip = (page - 1) * limit;

    const queryBuilder: SelectQueryBuilder<User> = this.userRepository
      .createQueryBuilder('user')
      .select([
        'user.id',
        'user.email',
        'user.fullName',
        'user.role',
        'user.disabled',
        'user.isVerified',
        'user.ssoMask',
        'user.departments',
        'user.createdAt',
        'user.updatedAt',
      ]);

    // Apply filters
    if (role) {
      if (role === 'regular') {
        queryBuilder.andWhere('user.role IS NULL');
      } else {
        queryBuilder.andWhere('user.role = :role', { role });
      }
    }

    if (status) {
      const disabled = status === 'disabled';
      queryBuilder.andWhere('user.disabled = :disabled', { disabled });
    }

    if (search) {
      queryBuilder.andWhere(
        '(user.email LIKE :search OR user.fullName LIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Get total count for pagination
    const total = await queryBuilder.getCount();

    // Apply pagination
    const users = await queryBuilder
      .orderBy('user.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getMany();

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async updateUserRole(
    currentUserId: number,
    currentUserRole: string,
    targetUserId: number,
    newRole: 'super_user' | 'admin' | null
  ) {
    // Security Check 1: User can't degrade themselves
    if (currentUserId === targetUserId) {
      throw new ForbiddenException('You cannot change your own role');
    }

    // Get the target user
    const targetUser = await this.userRepository.findOne({ where: { id: targetUserId } });
    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    // Security Check 2: Role assignment restrictions based on current user's role
    if (currentUserRole === 'admin') {
      // Admin can only assign admin role and only to ordinary users (not super_users or other admins)
      if (newRole === 'super_user') {
        throw new ForbiddenException('Admin users cannot assign super_user role');
      }

      if (targetUser.role === 'super_user') {
        throw new ForbiddenException('Admin users cannot modify super_user accounts');
      }

      if (targetUser.role === 'admin' && targetUser.id !== currentUserId) {
        throw new ForbiddenException('Admin users cannot modify other admin accounts');
      }

      // Admin can only assign 'admin' role or remove role (set to null) from ordinary users
      if (newRole !== 'admin' && newRole !== null) {
        throw new ForbiddenException('Admin users can only assign admin role or remove roles from ordinary users');
      }
    } else if (currentUserRole === 'super_user') {
      // Super users can assign any role to any user (but not to themselves - already checked above)
      // No additional restrictions for super_user
    } else {
      throw new ForbiddenException('Insufficient privileges to assign roles');
    }

    // Security Check 3: Prevent removing super_user role if it's the last super user
    if (targetUser.role === 'super_user' && newRole !== 'super_user') {
      const superUserCount = await this.userRepository.count({
        where: { role: 'super_user' },
      });

      if (superUserCount <= 1) {
        throw new BadRequestException('Cannot remove the last super user');
      }
    }

    // Update the role
    targetUser.role = newRole;
    await this.userRepository.save(targetUser);

    return {
      message: 'User role updated successfully',
      user: {
        id: targetUser.id,
        email: targetUser.email,
        role: targetUser.role,
        fullName: targetUser.fullName,
        disabled: targetUser.disabled,
      },
    };
  }

  async updateUserStatus(
    currentUserId: number,
    currentUserRole: string,
    targetUserId: number,
    disabled: boolean
  ) {
    // Security Check 1: User can't disable themselves
    if (currentUserId === targetUserId) {
      throw new ForbiddenException('You cannot disable your own account');
    }

    // Get the target user
    const targetUser = await this.userRepository.findOne({ where: { id: targetUserId } });
    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    // Security Check 2: Status change restrictions based on current user's role
    if (currentUserRole === 'admin') {
      // Admin can disable only ordinary users (not super_users or other admins)
      if (targetUser.role === 'super_user') {
        throw new ForbiddenException('Admin users cannot disable super_user accounts');
      }

      if (targetUser.role === 'admin') {
        throw new ForbiddenException('Admin users cannot disable other admin accounts');
      }
    } else if (currentUserRole === 'super_user') {
      // Super users can disable anyone except themselves (already checked above)
      // But let's add an extra check to prevent disabling other super users if it would leave none active
      if (disabled && targetUser.role === 'super_user') {
        const activeSuperUserCount = await this.userRepository.count({
          where: { role: 'super_user', disabled: false },
        });

        if (activeSuperUserCount <= 1) {
          throw new BadRequestException('Cannot disable the last active super user');
        }
      }
    } else {
      throw new ForbiddenException('Insufficient privileges to change user status');
    }

    // Update the status
    targetUser.disabled = disabled;
    await this.userRepository.save(targetUser);

    return {
      message: `User ${disabled ? 'disabled' : 'enabled'} successfully`,
      user: {
        id: targetUser.id,
        email: targetUser.email,
        disabled: targetUser.disabled,
        role: targetUser.role,
        fullName: targetUser.fullName,
      },
    };
  }

  async getUserAccess(userId: number): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: {role: true, disabled: true }
    });
    return user;
  }

  /**
   * Create a new user (admin only)
   * @param currentUserRole Current user's role (for security checks)
   * @param createUserDto User creation data
   */
  async createUser(
    currentUserRole: string,
    createUserDto: AdminCreateUserDto
  ) {
    // Security Check 1: Only admin and super_user can create users
    if (currentUserRole !== 'admin' && currentUserRole !== 'super_user') {
      throw new ForbiddenException('Insufficient privileges to create users');
    }

    // Security Check 2: Admin cannot create super_user accounts
    if (currentUserRole === 'admin' && createUserDto.role === 'super_user') {
      throw new ForbiddenException('Admin users cannot create super_user accounts');
    }

    // Check if email already exists
    const existingEmail = await this.userRepository.findOne({ 
      where: { email: createUserDto.email } 
    });
    if (existingEmail) {
      throw new BadRequestException('Email already exists');
    }

    // Check if username already exists
    const existingUsername = await this.userRepository.findOne({ 
      where: { username: createUserDto.username } 
    });
    if (existingUsername) {
      throw new BadRequestException('Username already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    // Create user
    const newUser = this.userRepository.create({
      email: createUserDto.email,
      username: createUserDto.username,
      password: hashedPassword,
      fullName: createUserDto.fullName,
      role: createUserDto.role || null,
      disabled: createUserDto.disabled || false,
      departments: createUserDto.departments || null,
      isVerified: true, // Admin-created users are auto-verified
    });

    const savedUser = await this.userRepository.save(newUser);

    return {
      message: 'User created successfully',
      user: {
        id: savedUser.id,
        email: savedUser.email,
        username: savedUser.username,
        fullName: savedUser.fullName,
        role: savedUser.role,
        disabled: savedUser.disabled,
        departments: savedUser.departments,
      },
    };
  }

  /**
   * Update a user (admin only)
   * @param currentUserId Current user's ID
   * @param currentUserRole Current user's role
   * @param targetUserId Target user ID to update
   * @param updateUserDto User update data
   */
  async updateUser(
    currentUserId: number,
    currentUserRole: string,
    targetUserId: number,
    updateUserDto: AdminUpdateUserDto
  ) {
    // Security Check 1: Only admin and super_user can update users
    if (currentUserRole !== 'admin' && currentUserRole !== 'super_user') {
      throw new ForbiddenException('Insufficient privileges to update users');
    }

    // Get the target user
    const targetUser = await this.userRepository.findOne({ where: { id: targetUserId } });
    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    // Security Check 2: Admin cannot modify super_user or other admin accounts
    if (currentUserRole === 'admin') {
      if (targetUser.role === 'super_user') {
        throw new ForbiddenException('Admin users cannot modify super_user accounts');
      }
      if (targetUser.role === 'admin' && targetUser.id !== currentUserId) {
        throw new ForbiddenException('Admin users cannot modify other admin accounts');
      }
    }

    // Check if new email already exists (if email is being changed)
    if (updateUserDto.email && updateUserDto.email !== targetUser.email) {
      const existingEmail = await this.userRepository.findOne({ 
        where: { email: updateUserDto.email } 
      });
      if (existingEmail) {
        throw new BadRequestException('Email already exists');
      }
      targetUser.email = updateUserDto.email;
    }

    // Check if new username already exists (if username is being changed)
    if (updateUserDto.username && updateUserDto.username !== targetUser.username) {
      const existingUsername = await this.userRepository.findOne({ 
        where: { username: updateUserDto.username } 
      });
      if (existingUsername) {
        throw new BadRequestException('Username already exists');
      }
      targetUser.username = updateUserDto.username;
    }

    // Update other fields
    if (updateUserDto.fullName !== undefined) {
      targetUser.fullName = updateUserDto.fullName;
    }
    if (updateUserDto.departments !== undefined) {
      targetUser.departments = updateUserDto.departments;
    }

    // Update password if provided
    if (updateUserDto.password) {
      targetUser.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    const updatedUser = await this.userRepository.save(targetUser);

    return {
      message: 'User updated successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        username: updatedUser.username,
        fullName: updatedUser.fullName,
        role: updatedUser.role,
        disabled: updatedUser.disabled,
        departments: updatedUser.departments,
      },
    };
  }

  /**
   * Delete a user (admin only)
   * @param currentUserId Current user's ID
   * @param currentUserRole Current user's role
   * @param targetUserId Target user ID to delete
   */
  async deleteUser(
    currentUserId: number,
    currentUserRole: string,
    targetUserId: number
  ) {
    // Security Check 1: User cannot delete themselves
    if (currentUserId === targetUserId) {
      throw new ForbiddenException('You cannot delete your own account');
    }

    // Security Check 2: Only admin and super_user can delete users
    if (currentUserRole !== 'admin' && currentUserRole !== 'super_user') {
      throw new ForbiddenException('Insufficient privileges to delete users');
    }

    // Get the target user
    const targetUser = await this.userRepository.findOne({ where: { id: targetUserId } });
    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    // Security Check 3: Admin cannot delete super_user or other admin accounts
    if (currentUserRole === 'admin') {
      if (targetUser.role === 'super_user') {
        throw new ForbiddenException('Admin users cannot delete super_user accounts');
      }
      if (targetUser.role === 'admin') {
        throw new ForbiddenException('Admin users cannot delete other admin accounts');
      }
    }

    // Security Check 4: Prevent deleting the last super_user
    if (targetUser.role === 'super_user') {
      const superUserCount = await this.userRepository.count({
        where: { role: 'super_user' },
      });

      if (superUserCount <= 1) {
        throw new BadRequestException('Cannot delete the last super user');
      }
    }

    // Soft delete (using BaseEntity's deleted field)
    await this.userRepository.softRemove(targetUser);

    return {
      message: 'User deleted successfully',
      user: {
        id: targetUser.id,
        email: targetUser.email,
        username: targetUser.username,
      },
    };
  }
}
