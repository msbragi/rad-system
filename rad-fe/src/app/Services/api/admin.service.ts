import { Injectable } from "@angular/core";
import { Observable, map } from "rxjs";
import { IResponse } from "../../Models/auth.interface";
import { IUser } from "../../Models/models.interface";
import { ApiService } from "./api.service";

@Injectable({
  providedIn: "root",
})
export class AdminService {
  constructor(private apiService: ApiService) {}

  /**
   * Get all users (admin only)
   * @returns Observable with users array
   */
  getAllUsers(): Observable<IUser[]> {
    return this.apiService.get<IResponse>("admin/users").pipe(
      map((response: IResponse) => {
        const users = response.data.users as IUser[];
        return users;
      }),
    );
  }

  /**
   * Update user role (admin only)
   * @param userId User ID to update
   * @param role New role ('user', 'admin', or 'super_user')
   * @returns Observable with updated user data
   */
  updateUserRole(userId: number, role: string): Observable<IUser> {
    return this.apiService
      .patch<IResponse>(
        `admin/users/${userId}/role`,
        { role },
        "User role updated successfully",
      )
      .pipe(
        map((response: IResponse) => {
          return response.data.user as IUser;
        }),
      );
  }

  /**
   * Update user disabled status (admin only)
   * @param userId User ID to update
   * @param disabled Whether the user should be disabled
   * @returns Observable with updated user data
   */
  updateUserStatus(userId: number, disabled: boolean): Observable<IUser> {
    return this.apiService
      .patch<IResponse>(
        `admin/users/${userId}/status`,
        { disabled },
        "User status updated successfully",
      )
      .pipe(
        map((response: IResponse) => {
          return response.data.user as IUser;
        }),
      );
  }

  /**
   * Create a new user (admin only)
   * @param userData User data
   * @returns Observable with created user data
   */
  createUser(userData: Partial<IUser>): Observable<IUser> {
    return this.apiService
      .post<IResponse>("admin/users", userData, "User created successfully")
      .pipe(
        map((response: IResponse) => {
          return response.data.user as IUser;
        }),
      );
  }

  /**
   * Update a user (admin only)
   * @param userId User ID to update
   * @param userData User data to update
   * @returns Observable with updated user data
   */
  updateUser(userId: number, userData: Partial<IUser>): Observable<IUser> {
    return this.apiService
      .put<IResponse>(
        `admin/users/${userId}`,
        userData,
        "User updated successfully",
      )
      .pipe(
        map((response: IResponse) => {
          return response.data.user as IUser;
        }),
      );
  }

  /**
   * Delete a user (admin only)
   * @param userId User ID to delete
   * @returns Observable with success message
   */
  deleteUser(userId: number): Observable<any> {
    return this.apiService
      .delete<IResponse>(`admin/users/${userId}`, "User deleted successfully")
      .pipe(
        map((response: IResponse) => {
          return response.data;
        }),
      );
  }

  /**
   * Get admin statistics (admin only)
   * @returns Observable with admin statistics
   */
  getAdminStatistics(): Observable<any> {
    return this.apiService.get<IResponse>("admin/stats").pipe(
      map((response: IResponse) => {
        return response.data;
      }),
    );
  }
}
