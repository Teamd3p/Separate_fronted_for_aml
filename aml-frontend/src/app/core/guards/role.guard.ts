import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    console.log('RoleGuard: Checking role access...');
    
    const token = this.authService.getToken();
    if (!token) {
      console.log('RoleGuard: No token found, redirecting to login');
      this.router.navigate(['/auth/login']);
      return false;
    }

    const userRole = this.authService.getUserRoleFromToken();
    const requiredRoles = route.data['roles'] as string[];
    
    console.log('RoleGuard: User role:', userRole);
    console.log('RoleGuard: Required roles:', requiredRoles);

    if (!requiredRoles || requiredRoles.length === 0) {
      // No specific roles required, just need to be authenticated
      return true;
    }

    if (!userRole) {
      console.log('RoleGuard: No role found in token, access denied');
      this.router.navigate(['/auth/login']);
      return false;
    }

    // Check if user has any of the required roles
    const hasRequiredRole = requiredRoles.some(role => 
      userRole.toUpperCase() === role.toUpperCase() ||
      userRole.toUpperCase().includes(role.toUpperCase())
    );

    if (!hasRequiredRole) {
      console.log('RoleGuard: Insufficient permissions, redirecting based on role');
      this.redirectBasedOnRole(userRole);
      return false;
    }

    console.log('RoleGuard: Access granted');
    return true;
  }

  private redirectBasedOnRole(role: string): void {
    const upperRole = role.toUpperCase();
    
    if (upperRole.includes('ADMIN')) {
      this.router.navigate(['/admin/dashboard']);
    } else if (upperRole.includes('CUSTOMER')) {
      this.router.navigate(['/customer/dashboard']);
    } else {
      this.router.navigate(['/auth/login']);
    }
  }
}
