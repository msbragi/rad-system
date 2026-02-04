import { Injectable } from "@angular/core";
import { Observable, map } from "rxjs";
import { IResponse } from "../../Models/auth.interface";
import { IUser } from "../../Models/models.interface";
import { ApiService } from "./api.service";

@Injectable({
  providedIn: "root",
})
export class UserService {
  constructor(private apiService: ApiService) {}

  /**
   * Get the current user profile
   * @returns Observable with user data
   */
  getCurrentUser(): Observable<IUser> {
    return this.apiService.get<IResponse>("users/me").pipe(
      map((response: IResponse) => {
        return response.data as IUser;
      }),
    );
  }

  /**
   * Update the current user profile
   * @param userData User data to update (email is required, fullName and avatar are optional)
   * @returns Observable with updated user data
   */
  updateCurrentUser(userData: {
    email: string;
    fullName?: string;
    avatar?: string;
  }): Observable<IUser> {
    return this.apiService
      .put<IResponse>("users/me", userData, "Profile updated successfully")
      .pipe(
        map((response: IResponse) => {
          return response.data as IUser;
        }),
      );
  }
}
