import { HttpInterceptorFn } from '@angular/common/http';
import { HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<any>, next: HttpHandlerFn) => {
  const token = localStorage.getItem('access_token');
  const router = inject(Router);

  if (token) {
    const tokenPayload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
    console.log(tokenPayload);
    
    
    if (tokenPayload.exp < currentTime) {
      // Token has expired
      localStorage.removeItem('access_token');
      router.navigate(['/login']);
      return next(req); // Stop the request if the token is expired
    }

    // Token is still valid, attach it to headers
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }
  else{
    router.navigate(['/login']);
  }

  return next(req);
};