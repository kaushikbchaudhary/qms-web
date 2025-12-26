import jwt, { JwtPayload } from 'jsonwebtoken';

/** Decode JWT without verification and reject expired tokens for middleware gating. */
export function verifyJwt(token: string) {
    try {
        const decoded = jwt.decode(token) as JwtPayload | string | null;
        console.log('Decoded JWT:', decoded);
        if (!decoded || typeof decoded === 'string') {
            return null;
        }

        // Treat expired tokens as invalid to avoid redirect loops.
        console.log('Token expiration time (exp):', decoded.exp);
        if (decoded.exp && decoded.exp * 1000 < Date.now()) {
            return null;
        }

        return decoded;
    } catch {
        return null;
    }
}
