// server/src/middleware/authMiddleware.ts
import {type Request,type Response,type NextFunction } from 'express';
import jwt from 'jsonwebtoken';



const JWT_SECRET = process.env.JWT_SECRET as string;

// Extend the Express Request type to include our user payload
export interface AuthRequest extends Request {
  user?: any;
}

export const protect = (req: AuthRequest, res: Response, next: NextFunction): void => {
  // 1. Get the token from the header (Format: "Bearer <token>")
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Not authorized, no token provided' });
    return;
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Not authorized, token missing' });
    return;
  }

  try {
    // 2. Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as unknown as { id: number };
    
    // 3. Attach the user ID to the request object so the next function can use it
    req.user = { id: decoded.id };
    
    // 4. Move to the next function (the controller)
    next();
  } catch (error) {
    res.status(401).json({ error: 'Not authorized, invalid token' });
  }
};