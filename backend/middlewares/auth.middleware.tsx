// auth.middleware.tsx
// This file contains the middleware function to authenticate requests using JWT tokens.

import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../config/jwt";

export const auth = (req: Request, res: Response, next: NextFunction) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  
  if (!token) return res.status(401).json({ error: "No token" });
  
  try {
    const decoded = verifyToken(token);
    (req as any).user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
};