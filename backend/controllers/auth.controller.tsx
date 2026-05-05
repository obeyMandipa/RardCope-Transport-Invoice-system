// auth.controller.tsx
// This file contains the controller functions for user authentication (signup and login).

import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { User } from "../models/User";
import { generateToken } from "../config/jwt";

export const signup = async (req: Request, res: Response) => {
  const { name, email, password } = req.body;
  const hashed = await bcrypt.hash(password, 10);
  
  const user = new User({ name, email, password: hashed });
  await user.save();
  
  const token = generateToken(user._id.toString());
  res.json({ token, user: { id: user._id, name, email } });
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  
  const token = generateToken(user._id.toString());
  res.json({ token, user: { id: user._id, name: user.name, email } });
};