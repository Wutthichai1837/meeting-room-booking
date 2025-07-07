import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, message: 'กรุณาระบุอีเมล' },
        { status: 400 }
      );
    }

    const user = await db.queryRow(
      `SELECT id FROM users WHERE email = ?`,
      [email]
    ) as any;

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'ไม่พบอีเมลนี้ในระบบ' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'พบอีเมลในระบบ',
    });
  } catch (error) {
    console.error('verify-email error:', error);
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในระบบ' },
      { status: 500 }
    );
  }
}
