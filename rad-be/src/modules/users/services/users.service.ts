import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SsoUserData } from 'src/modules/auth/sso-providers/sso-provider.interface';
import { Repository } from 'typeorm';
import { BaseService } from '../../../common/services/base.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { User } from '../entities/user.entity';

@Injectable()
export class UsersService extends BaseService<User> {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) {
        super(userRepository);
    }

    protected async checkOwnership(id: number, userId: number): Promise<boolean> {
        // Users can only access their own profile
        return id === userId;
    }

    async create(createUserDto: CreateUserDto): Promise<User> {
        // Create the user first
        const user = await super.create(createUserDto);

        if (!user) {
            throw new Error('Failed to create user account');
        }

        return user;
    }

    async findByEmailOrUsername(identifier: string): Promise<User | undefined> {
        return this.userRepository.findOne({
            where: [
                { email: identifier },
                { username: identifier }
            ],
            select: {
                id: true,
                email: true,
                username: true,
                password: true,  // Explicitly include excluded field
                fullName: true,
                ssoMask: true,
                avatar: true,
                verifyToken: true,
                isVerified: true,
                pwdResetToken: true,
                pwdResetExpires: true,
                role: true,      // Include admin role field
                disabled: true,  // Include admin disabled field
            }
        });
    }

    /**
     * Find a user by their ID with selected fields
     * @param id The user ID to search for
     * @returns User data without sensitive fields
     */
    async findById(id: number): Promise<User | undefined> {
        return super.findOne(id, {
            select: {
                id: true,
                email: true,
                fullName: true,
                ssoMask: true,
                avatar: true,
                isVerified: true,
                role: true,      // Include admin role field
                disabled: true,  // Include admin disabled field
            }
        });
    }

    async findUserWithDetails(userId: number): Promise<User | undefined> {
        const user = await super.findOne(userId, {
            relations: ['userSubscriptions']
        });
        if (!user) {
            throw new Error('User not found');
        }
        return user;
    }

    async upsertFromSso(ssoUserData: SsoUserData, password: string): Promise<User> {
        // Cerca utente per email (preferito) o username
        let user = await this.userRepository.findOne({
            where: [
                { email: ssoUserData.email },
                ...(ssoUserData.username ? [{ username: ssoUserData.username }] : [])
            ]
        });

        // Prepara i dati da sincronizzare
        const updateData: Partial<User> = {
            email: ssoUserData.email,
            username: ssoUserData.username,
            fullName: ssoUserData.fullName ?? '',
            departments: ssoUserData.departments ?? '',
            avatar: ssoUserData.avatar ?? '',
            ssoMask: ssoUserData.ssoMask,
            isVerified: true,
            password: await super.hashPassword(password),
        };
        if (user) {
// TODO: Verificare bene la logica di aggiornamento dei dati            
            updateData.username = user.username; // username non può essere cambiato
            updateData.ssoMask = updateData.ssoMask | user.ssoMask; // aggiorna elenco sso
            updateData.departments = user.departments; // Amministratore su profilo locale
            updateData.avatar = user.avatar ?? updateData.avatar; // User da Profilo locale
            updateData.fullName = user.fullName ?? updateData.fullName; // User da Profilo locale
            Object.assign(user, updateData);
            await this.userRepository.save(user);
        } else {
            user = this.userRepository.create(updateData);
            await this.userRepository.save(user);
        }
        return user;
    }

}
