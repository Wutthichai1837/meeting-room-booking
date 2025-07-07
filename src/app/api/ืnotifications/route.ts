import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { extractToken, verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = extractToken(authHeader);

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'ไม่พบ token การยืนยันตัวตน' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { success: false, message: 'Token ไม่ถูกต้อง' },
        { status: 401 }
      );
    }

    const now = new Date().toISOString();

    // ดึงแจ้งเตือนเป็นจองที่ยังไม่เริ่ม และสถานะ confirmed หรือ approved
    const notifications = await db.query(
      `SELECT b.id, b.title, b.start_time, b.end_time, r.name as room_name, b.status
       FROM bookings b
       JOIN meeting_rooms r ON b.room_id = r.id
       WHERE b.user_id = ? 
         AND b.start_time > ? 
         AND b.status IN ('approved')
       ORDER BY b.start_time ASC
       LIMIT 20`,
      [payload.userId, now]
    );

    return NextResponse.json({ success: true, data: notifications }, { status: 200 });
  } catch (error) {
    console.error('Fetch notifications error:', error);
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในการดึงข้อมูลแจ้งเตือน' },
      { status: 500 }
    );
  }
}
