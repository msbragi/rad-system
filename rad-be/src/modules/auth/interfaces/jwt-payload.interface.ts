export type UserRole = 'super_user' | 'admin' | 'user' | 'guest' | 'service' | null;
export interface JwtPayload {
    sub: number;
    email: string;
    role?: UserRole;
    ssoMask?: number;
    disabled?: boolean;
    iat?: number;
    exp?: number;
}