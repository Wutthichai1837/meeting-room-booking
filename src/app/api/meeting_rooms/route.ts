import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";

    const rooms = await db.query(
      `SELECT id, name, description, location, capacity, is_active, created_at
       FROM meeting_rooms
       WHERE name LIKE ? OR description LIKE ? OR location LIKE ?
       ORDER BY created_at DESC`,
      [`%${search}%`, `%${search}%`, `%${search}%`]
    );

    return NextResponse.json({ success: true, rooms: rooms }, { status: 200 });
  } catch (error) {
    console.error('Fetch rooms error:', error);
    return NextResponse.json({ success: false, message: 'เกิดข้อผิดพลาดในการดึงข้อมูล' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, location, capacity } = body;

    if (!name || !capacity) {
      return NextResponse.json({ success: false, message: 'กรุณากรอกชื่อห้องและจำนวนความจุ' }, { status: 400 });
    }

    // ตรวจสอบว่าชื่อห้องซ้ำหรือไม่
    const existingRoom = await db.queryRow(
      `SELECT id FROM meeting_rooms WHERE name = ?`,
      [name]
    );

    if (existingRoom) {
      return NextResponse.json({ success: false, message: 'ชื่อห้องนี้ถูกใช้แล้ว' }, { status: 409 });
    }

    const insertResult = await db.query(
      `INSERT INTO meeting_rooms (name, description, location, capacity, is_active) 
       VALUES (?, ?, ?, ?, 1)`,
      [name, description || null, location || null, capacity]
    );

    return NextResponse.json({
      success: true,
      message: 'เพิ่มห้องประชุมสำเร็จ',
      data: { id: (insertResult as { insertId: number }).insertId }
    }, { status: 201 });

  } catch (error) {
    console.error('Create room error:', error);
    return NextResponse.json({ success: false, message: 'เกิดข้อผิดพลาดในระบบ' }, { status: 500 });
  }
}