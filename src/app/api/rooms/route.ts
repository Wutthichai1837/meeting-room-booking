import { NextResponse } from 'next/server';
import { db } from '@/lib/database'; // เชื่อมต่อ MySQL

export async function GET() {
  try {
    // ดึงข้อมูลรวมทั้ง id จากตาราง meeting_rooms
    const rooms = await db.query(
      `SELECT id, name, description, location, capacity FROM meeting_rooms WHERE is_active = 1`
    );

    return NextResponse.json(rooms);
  } catch (error) {
    console.error('❌ Failed to fetch meeting rooms:', error);
    return NextResponse.json(
      { success: false, message: 'ไม่สามารถดึงข้อมูลห้องประชุมได้' },
      { status: 500 }
    );
  }
}
