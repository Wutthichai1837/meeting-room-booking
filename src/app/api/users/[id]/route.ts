import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: paramId } = await params;
    const userId = parseInt(paramId);

    if (isNaN(userId)) {
      return NextResponse.json({ success: false, message: 'Invalid user ID' }, { status: 400 });
    }

    const body = await req.json();
    const { username, email, first_name, last_name, phone, department, role } = body;

    if (!username || !email || !first_name || !last_name) {
      return NextResponse.json({ success: false, message: 'กรุณากรอกข้อมูลให้ครบถ้วน' }, { status: 400 });
    }

    // ตรวจสอบว่า username หรือ email ซ้ำหรือไม่ (ยกเว้นของตัวเอง)
    const existingUser = await db.queryRow(
      `SELECT id FROM users WHERE (username = ? OR email = ?) AND id != ?`,
      [username, email, userId]
    );

    if (existingUser) {
      return NextResponse.json({ success: false, message: 'ชื่อผู้ใช้หรืออีเมลนี้ถูกใช้แล้ว' }, { status: 409 });
    }

    await db.query(
      `UPDATE users 
       SET username = ?, email = ?, first_name = ?, last_name = ?, phone = ?, department = ?, role = ?
       WHERE id = ?`,
      [username, email, first_name, last_name, phone || null, department || null, role || 'user', userId]
    );

    return NextResponse.json({
      success: true,
      message: 'อัปเดตข้อมูลสำเร็จ'
    }, { status: 200 });

  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json({ success: false, message: 'เกิดข้อผิดพลาดในระบบ' }, { status: 500 });
  }
}
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: paramId } = await params;
    const userId = parseInt(paramId);

    if (isNaN(userId)) {
      return NextResponse.json({ success: false, message: 'Invalid user ID' }, { status: 400 });
    }

    // ตรวจสอบว่าผู้ใช้มีการจองที่ยังไม่เสร็จสิ้นหรือไม่
    const activeBookings = await db.queryRow(
      `SELECT id FROM bookings WHERE user_id = ? AND end_time > NOW()`,
      [userId]
    );

    if (activeBookings) {
      return NextResponse.json({ 
        success: false, 
        message: 'ไม่สามารถลบผู้ใช้ที่มีการจองที่ยังไม่เสร็จสิ้น' 
      }, { status: 400 });
    }

    await db.query('DELETE FROM users WHERE id = ?', [userId]);

    return NextResponse.json({
      success: true,
      message: 'ลบผู้ใช้สำเร็จ'
    }, { status: 200 });

  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json({ success: false, message: 'เกิดข้อผิดพลาดในระบบ' }, { status: 500 });
  }
}