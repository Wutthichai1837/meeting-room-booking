import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

// Environment variables
const JWT_SECRET = process.env.JWT_SECRET! || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// -------------------- Types --------------------
export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  department: string;
  role: 'user' | 'admin';
  is_active: boolean;
}

export interface JWTPayload {
  userId: number;
  email: string;
  role: 'user' | 'admin';
  first_name: string;
  last_name: string;
  username: string;
}

// -------------------- Password Handling --------------------
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}

// -------------------- JWT Handling --------------------
export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload as object, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    console.error('🔐 Token verification failed:', error);
    return null;
  }
}

export function extractToken(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.slice(7).trim();
}

// -------------------- Extract User from Request --------------------
export function getUserFromRequest(req: NextRequest): { user: JWTPayload | null; username: string | null } {
  const authHeader = req.headers.get('authorization');
  const token = extractToken(authHeader);

  if (!token) return { user: null, username: null };

  const user = verifyToken(token);
  const username = user ? `${user.first_name} ${user.last_name}`.trim() : null;

  return { user, username };
}

// -------------------- Validation Utilities --------------------
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePassword(password: string): { isValid: boolean; message: string } {
  if (password.length < 6) {
    return { isValid: false, message: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' };
  }
  if (!/(?=.*[a-z])/.test(password)) {
    return { isValid: false, message: 'รหัสผ่านต้องมีตัวอักษรเล็กอย่างน้อย 1 ตัว' };
  }
  if (!/(?=.*\d)/.test(password)) {
    return { isValid: false, message: 'รหัสผ่านต้องมีตัวเลขอย่างน้อย 1 ตัว' };
  }
  return { isValid: true, message: 'รหัสผ่านถูกต้อง' };
}

export function validatePhone(phone: string): boolean {
  const phoneRegex = /^(0[0-9]{1,2}-?[0-9]{3}-?[0-9]{4})$|^(0[0-9]{8,9})$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}
