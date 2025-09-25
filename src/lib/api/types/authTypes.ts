export interface AuthPayload {
    phoneNumber?: string;
    email?: string;
    otp?: string;
}

export interface PasswordLoginPayload {
    email: string;
    password: string;
}

export interface AuthResponse {
    success: boolean;
    message: string;
    data?: any;
}
