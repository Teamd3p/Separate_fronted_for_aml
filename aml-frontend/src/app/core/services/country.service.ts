import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Country, CountryCreateRequest, CountryUpdateRequest } from '../models/country.models';
import { AuthTokenService } from './auth-token.service';

@Injectable({
  providedIn: 'root'
})
export class CountryService {
  private readonly API_URL = `${environment.apiUrl || 'http://localhost:8080/api'}`;

  constructor(
    private http: HttpClient,
    private authTokenService: AuthTokenService
  ) {}

  // Get all countries
  getCountries(): Observable<Country[]> {
    return this.http.get<any>(`${this.API_URL}/admin/countries`, this.getHttpOptions()).pipe(
      map((response: any) => {
        // Handle different response formats
        let countriesData: any[] = [];
        if (Array.isArray(response)) {
          countriesData = response;
        } else if (response && Array.isArray(response.data)) {
          countriesData = response.data;
        } else if (response && Array.isArray(response.content)) {
          countriesData = response.content;
        } else if (response && Array.isArray(response.countries)) {
          countriesData = response.countries;
        }

        return countriesData.map(country => this.mapToCountry(country));
      })
    );
  }

  // Get country by ID
  getCountryById(id: number): Observable<Country> {
    return this.http.get<any>(`${this.API_URL}/admin/countries/${id}`, this.getHttpOptions()).pipe(
      map((response: any) => {
        const countryData = response.data || response;
        return this.mapToCountry(countryData);
      })
    );
  }

  // Create new country
  createCountry(countryData: CountryCreateRequest): Observable<Country> {
    const payload = {
      code: countryData.code?.toUpperCase(),
      name: countryData.name,
      riskLevel: countryData.riskLevel || 'MEDIUM'
    };
    
    return this.http.post<any>(`${this.API_URL}/admin/countries`, payload, this.getHttpOptions()).pipe(
      map((response: any) => {
        const responseData = response.data || response;
        return this.mapToCountry(responseData);
      }),
      catchError(error => {
        console.error('Country create failed:', error);
        return throwError(() => error);
      })
    );
  }

  // Update country
  updateCountry(code: string, countryData: CountryUpdateRequest): Observable<Country> {
    const payload = {
      code: countryData.code?.toUpperCase(),
      name: countryData.name,
      riskLevel: countryData.riskLevel || 'MEDIUM'
    };
    
    return this.http.put<any>(`${this.API_URL}/admin/countries/${code}`, payload, this.getHttpOptions()).pipe(
      map((response: any) => {
        const responseData = response.data || response;
        return this.mapToCountry(responseData);
      }),
      catchError(error => {
        console.error('Country update failed:', error);
        return throwError(() => error);
      })
    );
  }

  // Delete country (soft delete by setting isActive to false)
  deleteCountry(code: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/admin/countries/${code}`, this.getHttpOptions());
  }

  // Toggle country status
  toggleCountryStatus(code: string, isActive: boolean): Observable<Country> {
    return this.http.patch<any>(`${this.API_URL}/admin/countries/${code}/status`, 
      { isActive }, this.getHttpOptions()).pipe(
      map((response: any) => {
        const countryData = response.data || response;
        return this.mapToCountry(countryData);
      })
    );
  }

  // Helper method to map API response to Country interface
  private mapToCountry(data: any): Country {
    return {
      code: data.code || data.countryCode || '',
      name: data.name || data.countryName || '',
      riskLevel: data.riskLevel || data.risk || data.riskCategory || 'MEDIUM',
      isActive: data.isActive !== false && data.status !== 'INACTIVE',
      createdAt: data.createdAt || data.dateCreated,
      updatedAt: data.updatedAt || data.dateUpdated
    };
  }


  // Helper methods
  private getHttpOptions() {
    return this.authTokenService.getHttpOptions();
  }
}
