import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: paramId } = await params;
  const roomId = parseInt(paramId);
  
  if (isNaN(roomId)) {
    return NextResponse.json({ message: 'Invalid room ID' }, { status: 400 });
  }

  try {
    const data = await db.query('SELECT * FROM meeting_rooms WHERE id = ?', [roomId]) as any[];
    
    if (data.length === 0) {
      return NextResponse.json({ message: 'Room not found' }, { status: 404 });
    }

    const room = data[0];
    const formattedRoom = {
      id: room.id,
      name: room.name,
      description: room.description,
      location: room.location,
      capacity: room.capacity,
      is_active: room.is_active
    };

    return NextResponse.json({ room: formattedRoom }, { status: 200 });
  } catch (error) {
    console.error('Error fetching room:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: paramId } = await params;
    const roomId = parseInt(paramId);

    if (isNaN(roomId)) {
      return NextResponse.json({ success: false, message: 'Invalid room ID' }, { status: 400 });
    }

    const body = await req.json();
    const { name, description, location, capacity } = body;

    if (!name || !capacity) {
      return NextResponse.json({ success: false, message: 'กรุณากรอกชื่อห้องและจำนวนความจุ' }, { status: 400 });
    }

    // ตรวจสอบว่าชื่อห้องซ้ำหรือไม่ (ยกเว้นของตัวเอง)
    const existingRoom = await db.queryRow(
      `SELECT id FROM meeting_rooms WHERE name = ? AND id != ?`,
      [name, roomId]
    );

    if (existingRoom) {
      return NextResponse.json({ success: false, message: 'ชื่อห้องนี้ถูกใช้แล้ว' }, { status: 409 });
    }

    await db.query(
      `UPDATE meeting_rooms 
       SET name = ?, description = ?, location = ?, capacity = ?
       WHERE id = ?`,
      [name, description || null, location || null, capacity, roomId]
    );

    return NextResponse.json({
      success: true,
      message: 'อัปเดตข้อมูลห้องประชุมสำเร็จ'
    }, { status: 200 });

  } catch (error) {
    console.error('Update room error:', error);
    return NextResponse.json({ success: false, message: 'เกิดข้อผิดพลาดในระบบ' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: paramId } = await params;
    const roomId = parseInt(paramId);

    if (isNaN(roomId)) {
      return NextResponse.json({ success: false, message: 'Invalid room ID' }, { status: 400 });
    }

    // ตรวจสอบว่าห้องมีการจองที่ยังไม่เสร็จสิ้นหรือไม่
    const activeBookings = await db.queryRow(
      `SELECT id FROM bookings WHERE room_id = ? AND end_time > NOW()`,
      [roomId]
    );

    if (activeBookings) {
      return NextResponse.json({ 
        success: false, 
        message: 'ไม่สามารถลบห้องที่มีการจองที่ยังไม่เสร็จสิ้น' 
      }, { status: 400 });
    }

    await db.query('DELETE FROM meeting_rooms WHERE id = ?', [roomId]);

    return NextResponse.json({
      success: true,
      message: 'ลบห้องประชุมสำเร็จ'
    }, { status: 200 });

  } catch (error) {
    console.error('Delete room error:', error);
    return NextResponse.json({ success: false, message: 'เกิดข้อผิดพลาดในระบบ' }, { status: 500 });
  }
}