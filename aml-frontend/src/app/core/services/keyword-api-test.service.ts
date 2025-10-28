import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AuthTokenService } from './auth-token.service';

@Injectable({
  providedIn: 'root'
})
export class KeywordApiTestService {
  private readonly API_URL = `${environment.apiUrl || 'http://localhost:8080/api'}`;

  constructor(
    private http: HttpClient,
    private authTokenService: AuthTokenService
  ) {}

  /**
   * Test the keyword API endpoints to identify backend issues
   */
  async testKeywordEndpoints(): Promise<void> {
    console.log('=== KEYWORD API TEST STARTED ===');
    console.log('API URL:', this.API_URL);
    console.log('Token:', this.authTokenService.getToken()?.substring(0, 20) + '...');

    // Test 1: GET all keywords
    console.log('\n--- Test 1: GET /admin/keywords ---');
    try {
      const keywords = await this.http.get(`${this.API_URL}/admin/keywords`, this.authTokenService.getHttpOptions()).toPromise();
      console.log('✓ GET Success:', keywords);
    } catch (error: any) {
      console.error('✗ GET Failed:', error);
      console.error('Status:', error.status);
      console.error('Error body:', error.error);
    }

    // Test 2: POST create keyword
    console.log('\n--- Test 2: POST /admin/keywords ---');
    const testKeyword = {
      word: 'test-keyword-' + Date.now(),  // Backend expects 'word'
      category: 'OTHER',
      severity: 50,
      active: true  // Backend expects 'active'
    };
    console.log('Payload:', testKeyword);
    
    try {
      const created = await this.http.post(`${this.API_URL}/admin/keywords`, testKeyword, this.authTokenService.getHttpOptions()).toPromise();
      console.log('✓ POST Success:', created);
      
      // Test 3: PUT update keyword (if creation succeeded)
      const createdId = (created as any)?.id || (created as any)?.data?.id;
      if (createdId) {
        console.log('\n--- Test 3: PUT /admin/keywords/' + createdId + ' ---');
        const updatePayload = {
          word: 'updated-test-keyword',  // Backend expects 'word'
          category: 'FRAUD',
          severity: 75,
          active: true  // Backend expects 'active'
        };
        console.log('Payload:', updatePayload);
        
        try {
          const updated = await this.http.put(`${this.API_URL}/admin/keywords/${createdId}`, updatePayload, this.authTokenService.getHttpOptions()).toPromise();
          console.log('✓ PUT Success:', updated);
        } catch (error: any) {
          console.error('✗ PUT Failed:', error);
          console.error('Status:', error.status);
          console.error('Error body:', error.error);
        }

        // Test 4: Toggle status (using PUT since backend doesn't have PATCH endpoint)
        console.log('\n--- Test 4: PUT /admin/keywords/' + createdId + ' (toggle status) ---');
        try {
          const togglePayload = {
            word: 'updated-test-keyword',
            category: 'FRAUD',
            severity: 75,
            active: false  // Toggle to inactive
          };
          const toggled = await this.http.put(`${this.API_URL}/admin/keywords/${createdId}`, togglePayload, this.authTokenService.getHttpOptions()).toPromise();
          console.log('✓ Toggle Success:', toggled);
        } catch (error: any) {
          console.error('✗ Toggle Failed:', error);
          console.error('Status:', error.status);
          console.error('Error body:', error.error);
        }

        // Test 5: DELETE keyword
        console.log('\n--- Test 5: DELETE /admin/keywords/' + createdId + ' ---');
        try {
          const deleted = await this.http.delete(`${this.API_URL}/admin/keywords/${createdId}`, this.authTokenService.getHttpOptions()).toPromise();
          console.log('✓ DELETE Success:', deleted);
        } catch (error: any) {
          console.error('✗ DELETE Failed:', error);
          console.error('Status:', error.status);
          console.error('Error body:', error.error);
        }
      }
    } catch (error: any) {
      console.error('✗ POST Failed:', error);
      console.error('Status:', error.status);
      console.error('Error body:', error.error);
    }

    console.log('\n=== KEYWORD API TEST COMPLETED ===');
  }

  /**
   * Test a specific keyword update to debug the 500 error
   */
  async testUpdateKeyword(id: number): Promise<void> {
    console.log(`=== TESTING UPDATE FOR KEYWORD ${id} ===`);
    
    // First, get the keyword
    console.log('\n--- Getting current keyword data ---');
    try {
      const current = await this.http.get(`${this.API_URL}/admin/keywords/${id}`, this.authTokenService.getHttpOptions()).toPromise();
      console.log('Current keyword:', current);

      // Try different payload formats
      const payloads = [
        {
          name: 'Correct payload with word and active',
          data: {
            word: (current as any)?.word || (current as any)?.data?.word || (current as any)?.keyword,
            category: (current as any)?.category || (current as any)?.data?.category || 'OTHER',
            severity: (current as any)?.severity || (current as any)?.data?.severity || 50,
            active: true
          }
        },
        {
          name: 'Payload with active=false',
          data: {
            word: (current as any)?.word || (current as any)?.data?.word || (current as any)?.keyword,
            category: (current as any)?.category || (current as any)?.data?.category || 'OTHER',
            severity: (current as any)?.severity || (current as any)?.data?.severity || 50,
            active: false
          }
        }
      ];

      for (const payload of payloads) {
        console.log(`\n--- Testing: ${payload.name} ---`);
        console.log('Payload:', payload.data);
        try {
          const result = await this.http.put(`${this.API_URL}/admin/keywords/${id}`, payload.data, this.authTokenService.getHttpOptions()).toPromise();
          console.log('✓ Success:', result);
        } catch (error: any) {
          console.error('✗ Failed:', error);
          console.error('Status:', error.status);
          console.error('Error body:', error.error);
        }
      }
    } catch (error: any) {
      console.error('Failed to get keyword:', error);
    }

    console.log('\n=== TEST COMPLETED ===');
  }
}
