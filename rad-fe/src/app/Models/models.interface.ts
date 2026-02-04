export interface IBase {
  id?: number | string;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export interface IAuth {
  googleToken?: string;
  username?: string;
  email?: string;
  password?: string;
}

export interface IDepartment extends IBase {
  id: number;
  code: string;
  description: string;
}

export interface IUser extends IBase {
  username: string;
  email: string;
  password?: string;
  fullName?: string;
  ssoMask?: number;
  avatar?: string;
  isVerified?: boolean | number;
  verifyToken?: string;
  pwdResetToken?: string;
  pwdResetExpires?: Date;
  role: string | "user";
  departments: string;
  disabled?: boolean;
}
