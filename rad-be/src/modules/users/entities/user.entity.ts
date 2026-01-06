import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { IUser } from '../../../common/interfaces/models.interface';

@Entity('users')
export class User extends BaseEntity implements IUser {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    email: string;

    @Column({ unique: true })
    username: string;

    @Column({ select: false })
    password?: string;

    @Column({ name: 'full_name', nullable: true })
    fullName?: string;

    @Column({ name: 'sso_mask', default: null })
    ssoMask?: number;

    @Column({ nullable: true })
    avatar?: string;

    @Column({ name: "is_verified", default: () => "'0'" })
    isVerified: boolean;

    @Column("varchar", { name: "verification_token", nullable: true, length: 255 })
    verifyToken: string | null;

    @Column("varchar", { name: "pwd_reset_token", nullable: true, length: 255 })
    pwdResetToken: string | null;

    @Column({ name: "departments", nullable: true })
    departments?: string;

    @Column("timestamp", { name: "pwd_reset_expires", nullable: true })
    pwdResetExpires: Date | null;

    @Column({
        type: 'enum',
        enum: ['super_user', 'admin'],
        nullable: true,
        default: null
    })
    role: 'super_user' | 'admin' | 'user' | 'guest' | 'service' | null;

    @Column({ default: false })
    disabled: boolean;

    // Admin helper methods
    isAdmin(): boolean {
        return this.role === 'admin' || this.role === 'super_user';
    }

    isSuperUser(): boolean {
        return this.role === 'super_user';
    }

    canManageUsers(): boolean {
        return this.isSuperUser(); // Only super users can manage other users
    }

    isActive(): boolean {
        return !this.disabled;
    }

    hasAdminAccess(): boolean {
        return this.isAdmin() && this.isActive();
    }

}