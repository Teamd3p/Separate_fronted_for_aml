import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Keyword, KeywordCreateRequest, KeywordUpdateRequest } from '../models/keyword.models';

@Injectable({
  providedIn: 'root'
})
export class KeywordService {
  private readonly API_URL = `${environment.apiUrl || 'http://localhost:8080/api'}`;

  constructor(private http: HttpClient) {}

  // Get all keywords
  getKeywords(): Observable<Keyword[]> {
    return this.http.get<any>(`${this.API_URL}/admin/keywords`, this.getHttpOptions()).pipe(
      map((response: any) => {
        // Handle different response formats
        let keywordsData: any[] = [];
        if (Array.isArray(response)) {
          keywordsData = response;
        } else if (response && Array.isArray(response.data)) {
          keywordsData = response.data;
        } else if (response && Array.isArray(response.content)) {
          keywordsData = response.content;
        } else if (response && Array.isArray(response.keywords)) {
          keywordsData = response.keywords;
        }

        return keywordsData.map(keyword => this.mapToKeyword(keyword));
      })
    );
  }

  // Get keyword by ID
  getKeywordById(id: number): Observable<Keyword> {
    return this.http.get<any>(`${this.API_URL}/admin/keywords/${id}`, this.getHttpOptions()).pipe(
      map((response: any) => {
        const keywordData = response.data || response;
        return this.mapToKeyword(keywordData);
      })
    );
  }

  // Create new keyword
  createKeyword(keywordData: KeywordCreateRequest): Observable<Keyword> {
    const payload = {
      keyword: keywordData.keyword,
      category: keywordData.category || 'OTHER',
      severity: keywordData.severity || 50,
      description: keywordData.description || '',
      isActive: true
    };
    
    return this.http.post<any>(`${this.API_URL}/admin/keywords`, payload, this.getHttpOptions()).pipe(
      map((response: any) => {
        const responseData = response.data || response;
        return this.mapToKeyword(responseData);
      }),
      catchError(error => {
        throw error;
      })
    );
  }

  // Update keyword
  updateKeyword(id: number, keywordData: KeywordUpdateRequest): Observable<Keyword> {
    const payload = {
      keyword: keywordData.keyword,
      category: keywordData.category || 'OTHER',
      severity: keywordData.severity || 50,
      description: keywordData.description || '',
      isActive: keywordData.isActive !== undefined ? keywordData.isActive : true
    };
    
    return this.http.put<any>(`${this.API_URL}/admin/keywords/${id}`, payload, this.getHttpOptions()).pipe(
      map((response: any) => {
        const responseData = response.data || response;
        return this.mapToKeyword(responseData);
      }),
      catchError(error => {
        throw error;
      })
    );
  }

  // Delete keyword (soft delete by setting isActive to false)
  deleteKeyword(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/admin/keywords/${id}`, this.getHttpOptions());
  }

  // Toggle keyword status
  toggleKeywordStatus(id: number, isActive: boolean): Observable<Keyword> {
    return this.http.patch<any>(`${this.API_URL}/admin/keywords/${id}/status`, 
      { isActive }, this.getHttpOptions()).pipe(
      map((response: any) => {
        const keywordData = response.data || response;
        return this.mapToKeyword(keywordData);
      })
    );
  }

  // Helper method to map API response to Keyword interface
  private mapToKeyword(data: any): Keyword {
    const mapped = {
      id: data.id || data.keywordId,
      keyword: data.keyword || data.keywordText || data.word || '',
      category: data.category || data.keywordCategory || 'OTHER',
      severity: data.severity || data.riskLevel || 50,
      description: data.description || data.desc || '',
      isActive: data.isActive !== false && data.status !== 'INACTIVE',
      createdAt: data.createdAt || data.dateCreated,
      updatedAt: data.updatedAt || data.dateUpdated
    };
    return mapped;
  }


  // Helper methods
  private getHttpOptions() {
    const token = this.getToken();
    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      })
    };
  }

  private getToken(): string | null {
    return localStorage.getItem('token');
  }
}
