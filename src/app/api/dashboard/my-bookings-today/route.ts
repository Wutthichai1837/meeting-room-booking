import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    // Get user info from JWT token
    const { user, username } = getUserFromRequest(req);
    
    if (!user || !username) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid or missing token' }, 
        { status: 401 }
      );
    }

    // Query bookings for today using the constructed username
    const result = await db.queryRow(
      `SELECT COUNT(*) AS count 
       FROM bookings 
       WHERE DATE(start_time) = CURDATE() 
       AND username = ? 
       AND status = 'confirmed'`,
      [username]
    );

    return NextResponse.json({ 
      count: result?.count || 0,
      username: username, // Include username for debugging
      user: {
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email
      }
    });

  } catch (error) {
    console.error('my-bookings-today error:', error);
    return NextResponse.json(
      { error: 'Internal server error', count: 0 }, 
      { status: 500 }
    );
  }
}
