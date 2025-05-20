import jwt from 'jsonwebtoken';

const JWT_SECRET = 'super_secret_key_1234567890';

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

export function authMiddleware(requiredRole) {
  return (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid token' });
    }
    const token = authHeader.split(' ')[1];
    try {
      const user = verifyToken(token);
      if (requiredRole && user.role !== requiredRole) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      req.user = user;
      next();
    } catch (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  };
} 
