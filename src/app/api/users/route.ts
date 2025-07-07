import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";

    const users = await db.query(
      `SELECT id, username, email, first_name, last_name, phone, department, role, is_active, created_at
       FROM users
       WHERE username LIKE ? OR email LIKE ? OR first_name LIKE ? OR last_name LIKE ?
       ORDER BY created_at DESC`,
      [`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`]
    );

    return NextResponse.json({ success: true, data: users }, { status: 200 });
  } catch (error) {
    console.error('Fetch users error:', error);
    return NextResponse.json({ success: false, message: 'เกิดข้อผิดพลาดในการดึงข้อมูล' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, email, first_name, last_name, phone, department, role, password } = body;

    if (!username || !email || !first_name || !last_name || !password) {
      return NextResponse.json({ success: false, message: 'กรุณากรอกข้อมูลให้ครบถ้วน' }, { status: 400 });
    }

    // ตรวจสอบว่า username หรือ email ซ้ำหรือไม่
    const existingUser = await db.queryRow(
      `SELECT id FROM users WHERE username = ? OR email = ?`,
      [username, email]
    );

    if (existingUser) {
      return NextResponse.json({ success: false, message: 'ชื่อผู้ใช้หรืออีเมลนี้ถูกใช้แล้ว' }, { status: 409 });
    }

    const insertResult = await db.query(
      `INSERT INTO users (username, email, first_name, last_name, phone, department, role, password_hash, is_active, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, Now())`,
      [username, email, first_name, last_name, phone || null, department || null, role || 'user', password]
    );

    return NextResponse.json({
      success: true,
      message: 'เพิ่มผู้ใช้สำเร็จ',
      data: { id: (insertResult as any).insertId }
    }, { status: 201 });

  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json({ success: false, message: 'เกิดข้อผิดพลาดในระบบ' }, { status: 500 });
  }
}