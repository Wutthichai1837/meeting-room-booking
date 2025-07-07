import { NextResponse } from 'next/server';
import { db } from '@/lib/database';

export async function GET() {
  try {
    const result = await db.queryRow(
      `SELECT COUNT(*) AS count FROM bookings WHERE start_time > NOW() AND status = 'confirmed'`
    );
    return NextResponse.json({ count: result?.count || 0 });
  } catch (error) {
    console.error('active-bookings error:', error);
    return NextResponse.json({ count: 0 }, { status: 200 });
  }
}