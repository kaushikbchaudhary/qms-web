export interface AuthPayload {
    phoneNumber?: string;
    email?: string;
    otp?: string;
}

export interface AuthResponse {
    status: string;
    message: string;
    data?: {
        user?: any; // Replace 'any' with your User type
        token?: string; // Optional if using cookies
    };
}