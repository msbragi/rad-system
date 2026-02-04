import { JwtPayload, UserRole } from "./jwt-payload.interface";

export interface IJwtStrategy extends JwtPayload {
    userId: number;
    email: string;
    role: UserRole;
    ssoMask: number;
    disabled: boolean;
    iat?: number;
    exp?: number;
}