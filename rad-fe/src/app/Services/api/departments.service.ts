import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiService } from './api.service';
import { IDepartment } from '../../Models/models.interface';
import { IResponse } from '../../Models/auth.interface';

@Injectable({
    providedIn: 'root'
})
export class DepartmentsService {
    private readonly endpoint = 'departments';

    constructor(private apiService: ApiService) { }

    /**
     * Get all departments
     */
    getAll(): Observable<IDepartment[]> {
        return this.apiService.get<IResponse>(`${this.endpoint}`).pipe(
            map((response: IResponse) => response.data as IDepartment[])
        );
    }

    /**
     * Get a single department by ID
     */
    getById(id: number): Observable<IDepartment> {
        return this.apiService.get<IResponse>(`${this.endpoint}/${id}`).pipe(
            map((response: IResponse) => response.data as IDepartment)
        );
    }

    /**
     * Create a new department
     */
    create(department: IDepartment): Observable<IDepartment> {
        department.code = department.code?.toUpperCase()
        return this.apiService.post<IDepartment>(this.endpoint, department);
    }

    /**
     * Update an existing department
     */
    update(id: number, department: Partial<IDepartment>): Observable<IDepartment> {
        department.code = department.code?.toUpperCase()
        return this.apiService.patch<IDepartment>(`${this.endpoint}/${id}`, department);
    }

    /**
     * Delete a department
     */
    delete(id: number): Observable<void> {
        return this.apiService.delete<void>(`${this.endpoint}/${id}`);
    }
}