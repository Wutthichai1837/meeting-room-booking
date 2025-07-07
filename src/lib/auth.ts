import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Types
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

// Hash password
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

// Verify password
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}

// Generate JWT token
export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// Verify JWT token
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

// Extract token from Authorization header
export function extractToken(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

// Get user info from request headers/token
export function getUserFromRequest(req: NextRequest): { user: JWTPayload | null; username: string | null } {
  const authHeader = req.headers.get('authorization');
  const token = extractToken(authHeader);
  
  if (!token) {
    return { user: null, username: null };
  }
  
  const user = verifyToken(token);
  if (!user) {
    return { user: null, username: null };
  }
  
  // Create username from firstName + lastName
  const username = `${user.first_name} ${user.last_name}`.trim();
  
  return { user, username };
}

// Validate email format
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate password strength
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

// Validate phone number (Thai format)
export function validatePhone(phone: string): boolean {
  const phoneRegex = /^(0[0-9]{1,2}-?[0-9]{3}-?[0-9]{4})$|^(0[0-9]{8,9})$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}
