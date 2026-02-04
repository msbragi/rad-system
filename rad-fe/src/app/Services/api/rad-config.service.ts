import { Injectable } from '@angular/core';
import { config, map, Observable } from 'rxjs';
import { IResponse } from '../../Models/auth.interface';
import { ApiService } from './api.service';

export interface IRadConfig {
  key: string;
  description?: string;
  value: any;
  isEnvValue: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class RadConfigService {
  private readonly endpoint = 'admin/config';

  constructor(private apiService: ApiService) { }

  findAll(): Observable<IRadConfig[]> {
    return this.apiService.get<IResponse>(this.endpoint).pipe(
      map((response: IResponse) => response.data as IRadConfig[])
    );
  }

  findOne(key: string): Observable<IRadConfig> {
    return this.apiService.get<IResponse>(`${this.endpoint}/${key}`).pipe(
      map((response: IResponse) => response.data as IRadConfig)
    );
  }

  private serializeAsString(value: any): string {
    if(!value) {
      value = {};
    }  
    if(typeof value === 'object' && !Array.isArray(value)) {
      value = JSON.stringify(value);
    }
    return value;
  }

  create(config: IRadConfig): Observable<IRadConfig> {
    config.value = this.serializeAsString(config.value);
    return this.apiService.post<IRadConfig>(this.endpoint, config);
  }

  update(key: string, config: Partial<IRadConfig>): Observable<IRadConfig> {
    config.value = this.serializeAsString(config.value);
    return this.apiService.put<IRadConfig>(`${this.endpoint}/${key}`, config);
  }

  delete(key: string): Observable<void> {
    return this.apiService.delete<void>(`${this.endpoint}/${key}`);
  }
  
  /**
   * Forza la reload della cache configurazioni lato backend
   */
  reloadConfigs(): Observable<IResponse> {
    return this.apiService.post<IResponse>(`${this.endpoint}/reload`, {});
  }

}