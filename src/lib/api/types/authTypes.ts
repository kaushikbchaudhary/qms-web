export interface AuthPayload {
    phoneNumber?: string;
    email?: string;
    otp?: string;
}

export interface PasswordLoginPayload {
    email: string;
    password: string;
}

export interface ForgotPasswordPayload {
    email: string;
}

export interface ResetPasswordPayload {
    token: string;
    password: string;
}

export type SessionSummary = {
    sessionId: string;
    deviceName?: string;
    ipAddress?: string;
    userAgent?: string;
    createdAt?: string;
    lastUsedAt?: string;
    isCurrent?: boolean;
};

export type AuthSuccessData = {
    user?: any;
    token?: string;
    refreshToken?: string;
    sessionId?: string;
};

export interface AuthResponse<T = AuthSuccessData> {
    success: boolean;
    message: string;
    data?: T;
}
