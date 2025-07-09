import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { verifyPassword, generateToken } from '@/lib/auth';
import { handleOptions, createCorsResponse, createErrorResponse } from '@/lib/cors';

export async function OPTIONS(request: NextRequest) {
  return handleOptions(request);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return createErrorResponse('กรุณากรอก Username และรหัสผ่าน', request, 400);
    }

    const user = await db.queryRow(
      `SELECT id, username, email, password_hash, first_name, last_name, phone, department, role
       FROM users WHERE username = ?`,
      [username]
    ) as any;

    if (!user || !user.password_hash) {
      return createErrorResponse('username or password incorrect', request, 401);
    }

    const isValidPassword = await verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
      return createErrorResponse('username or password incorrect', request, 401);
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      first_name: user.first_name,
      last_name: user.last_name,
      username: `${user.first_name} ${user.last_name}`,
    });

    const userData = {
      id: user.id,
      username: `${user.first_name} ${user.last_name}`,
      email: user.email,
      phone: user.phone,
      department: user.department,
      role: user.role
    };

    return createCorsResponse(
      {
        success: true,
        message: 'Login Successfully',
        data: {
          user: userData,
          token: token,
        },
      },
      request,
      200
    );

  } catch (error) {
    console.error('Login error:', error);
    return createErrorResponse('เกิดข้อผิดพลาดในระบบ', request, 500);
  }
}
