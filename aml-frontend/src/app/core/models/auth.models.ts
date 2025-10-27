export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth: string; // ISO date string
  nationality: string;
  contactNumber: string;
  street?: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  email?: string;
  role?: string;
  message: string;
}

export interface VerifyOtpRequest {
  email: string;
  otp: string;
}
