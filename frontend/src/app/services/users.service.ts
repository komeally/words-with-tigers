// users.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class UsersService {
  private apiUrl = 'http://localhost:3000/users'; // Adjust to your server's URL

  constructor(private http: HttpClient) {}

  // Function to register a new user
  registerUser(username: string, password: string): Observable<any> {
    const url = `${this.apiUrl}/register`;
    const body = { username, password };
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

    return this.http.post<any>(url, body, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  // Error handling method
  private handleError(error: any): Observable<never> {
    console.error('An error occurred:', error);
    throw new Error(error.message || 'Server error');
  }
}