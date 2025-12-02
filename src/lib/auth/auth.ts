import jwt, { JwtPayload } from 'jsonwebtoken';

export function verifyJwt(token: string) {
    try {
        const decoded = jwt.decode(token) as JwtPayload | string | null;
        if (!decoded || typeof decoded === 'string') {
            return null;
        }

        // Treat expired tokens as invalid to avoid redirect loops.
        if (decoded.exp && decoded.exp * 1000 < Date.now()) {
            return null;
        }

        return decoded;
    } catch {
        return null;
    }
}
