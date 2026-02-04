export interface IBase {
    createdAt: Date;
    updatedAt?: Date;
    deletedAt?: Date | null;
}

export interface IAuth {
    username?: string;
    email?: string;
    password?: string;
}

export interface IUser extends IBase {
    id: number;
    email: string;
    username?: string;
    password?: string;
    fullName?: string;
    /**
     * Bitmask SSO provider (null=local, 2=ldap, 4=google, ...)
     */
    ssoMask?: number;
    avatar?: string;
    isVerified?: boolean | number;
    verifyToken?: string;
    pwdResetToken?: string;
    pwdResetExpires?: Date;
    departments?: string;
    role?: 'super_user' | 'admin' | 'user' | 'guest' | 'service' | null;
    disabled?: boolean;
}

