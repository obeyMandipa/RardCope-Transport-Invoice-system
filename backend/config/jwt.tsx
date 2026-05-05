// jwt.ts
// This file contains the code to generate and verify JWT tokens using the jsonwebtoken library.

// @ts-ignore - Bypass strict JSONWebToken types
import * as jwt from "jsonwebtoken";

export const generateToken = (id: string): string => {
  const payload = { id };
  const secret = process.env.JWT_SECRET as string;
  const options = { 
    expiresIn: process.env.JWT_EXPIRES_IN || "30d" 
  } as any; // Type assertion
  
  return jwt.sign(payload, secret, options);
};

export const verifyToken = (token: string) => {
  const secret = process.env.JWT_SECRET as string;
  return jwt.verify(token, secret) as { id: string };
};