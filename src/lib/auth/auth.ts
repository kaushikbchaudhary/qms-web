import jwt from 'jsonwebtoken';

// const SECRET = process.env.JWT_SECRET; // match backend

export function verifyJwt(token: string) {
    try {
        const decoded = jwt.decode(token);
        // jwt.verify(token, SECRET, { algorithms: ['HS256'] });
        return decoded;
    } catch (err) {
        return null;
    }
}
