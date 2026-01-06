import { IUser } from "./models.interface";

export interface IRefreshTokenResponse {
  data: {
    access_token: string;
  };
  timestamp: string;
  path: string;
}

export interface IAuthResponse {
  data: {
    access_token: string;
    refresh_token: string;
    user: IUser;
  };
  timestamp: string;
  path: string;
}

export interface IResponse {
  data: any;
  timestamp: string;
  path: string;
}
