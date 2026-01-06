import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { FindManyOptions, FindOneOptions, Repository } from 'typeorm';
import { BaseEntity } from '../entities/base.entity';
import * as bcrypt from 'bcrypt';

export abstract class BaseService<T extends BaseEntity> {
    constructor(
        protected readonly repository: Repository<T>
    ) { }

    protected abstract checkOwnership(id: number, userId: number): Promise<boolean>;

    getRepository(): Repository<T> {    
        return this.repository;
    }

    async findAll(options?: FindManyOptions<T>): Promise<T[]> {
        return await this.repository.find(options);
    }

    async findOne(id: number | string, options?: FindOneOptions<T>): Promise<T> {
        return await this.repository.findOne({ where: { id } as any, ...(options as any) });
    }

    async create(createDto: any): Promise<T> {
        // Check if password field exists and hash it
        if (createDto.password) {
            createDto.password = await this.hashPassword(createDto.password);
        }

        const entity = this.repository.create(createDto) as any;
        return await this.repository.save(entity);
    }

    async update(id: number | string, updateDto: any): Promise<T> {
        // Check if password field exists and hash it
        if (updateDto.password) {
            updateDto.password = await this.hashPassword(updateDto.password);
        }

        await this.repository.update(id, updateDto);
        return this.findOne(id);
    }

    /**
     * Perform a soft delete if defined in configuration elese perform delete
     * @param id 
     */
    async remove(id: number): Promise<void> {
        // TODO: put configuration for soft delete
        //await this.repository.softDelete(id);
        await this.delete(id);
    }

    async delete(id: number): Promise<void> {
        await this.repository.delete(id);
    }

    async count(): Promise<number> {
        return this.repository.count();
    }
    
    // User-specific operations
    async findOneByUser(id: number, userId: number, options?: FindOneOptions<T>): Promise<T> {
        const hasAccess = await this.checkOwnership(id, userId);
        if (!hasAccess) {
            throw new ForbiddenException('Access denied');
        }
        const entity = await this.findOne(id, options);
        if (!entity) {
            throw new NotFoundException(`Entity not found`);
        }
        return entity;
    }

    async createByUser(createDto: any, userId: number): Promise<T> {
        createDto.userId = userId;
        return await this.create(createDto);
    }

    async updateByUser(id: number, userId: number, updateDto: any): Promise<T> {
        await this.findOneByUser(id, userId);
        return this.update(id, updateDto);
    }

    async removeByUser(id: number, userId: number): Promise<void> {
        await this.findOneByUser(id, userId);
        await this.remove(id);
    }

    /**
     * Check if a string is likely a bcrypt hash
     * @param str String to check
     * @returns Boolean indicating if the string appears to be a bcrypt hash
     */
    private isAlreadyHashed(str: string): boolean {
        // bcrypt hashes start with $2a$, $2b$, or $2y$ and are 60 characters long
        const bcryptPattern = /^\$2[abxy]\$\d+\$/;
        return bcryptPattern.test(str) && str.length === 60;
    }
    /**
     * Hash a password using bcrypt
     * @param plainPassword Plain text password to hash
     * @returns Hashed password
     */
    public async hashPassword(plainPassword: string): Promise<string> {
        if(this.isAlreadyHashed(plainPassword)) {
            return plainPassword;
        }
        // Generate a salt and hash the password
        const salt = await bcrypt.genSalt(10);
        return bcrypt.hash(plainPassword, salt);
    }

    /**
     * Compare a plain password with a hashed password
     * @param plainPassword Plain text password to check
     * @param hashedPassword Hashed password from database
     * @returns Boolean indicating if passwords match
     */
    public async comparePasswords(plainPassword: string, hashedPassword: string): Promise<boolean> {
        return bcrypt.compare(plainPassword, hashedPassword);
    }


}