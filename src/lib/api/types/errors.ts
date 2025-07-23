// export class ApiError extends Error {
//     statusCode: number;
//     details?: unknown;
//
//     constructor(message: string, statusCode: number, details?: unknown) {
//         super(message);
//         this.statusCode = statusCode;
//         this.details = details;
//         Object.setPrototypeOf(this, ApiError.prototype);
//     }
// }

export interface ApiErrorResponse {
    success: false;
    code: string;
    message: string;
    errors?: any;
    meta?: {
        timestamp: string;
        path: string;
        method: string;
    };
}
