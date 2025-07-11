import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { hashPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, newPassword } = body;

    // 🔒 ตรวจสอบข้อมูล
    if (!email  || !newPassword) {
      return NextResponse.json(
        { success: false, message: 'Please fill full form' },
        { status: 400 }
      );
    }

    // 🔍 ดึงข้อมูลผู้ใช้จากอีเมล
    const user = await db.queryRow(
      `SELECT id, password_hash FROM users WHERE email = ?`,
      [email]
    ) as { id: number; password_hash: string } | null;

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Not Found Your ID' },
        { status: 404 }
      );
    }

    // 🔑 เข้ารหัสรหัสผ่านใหม่
    const newHashedPassword = await hashPassword(newPassword);

    // 📝 อัปเดตรหัสผ่าน
    await db.query(
      `UPDATE users SET password_hash = ? WHERE id = ?`,
      [newHashedPassword, user.id]
    );

    return NextResponse.json({
      success: true,
      message: 'Change Password Successfully',
    });
  } catch (error) {
    console.error('❌ forgetpassword error:', error);
    return NextResponse.json(
      { success: false, message: 'Error in systems' },
      { status: 500 }
    );
  }
}
