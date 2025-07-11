import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Please provide an email.' },
        { status: 400 }
      );
    }

    const user = await db.queryRow(
      `SELECT id FROM users WHERE email = ?`,
      [email]
    ) as { id: number } | null;

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Email not found in the system.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Email found in the system.',
    });
  } catch (error) {
    console.error('verify-email error:', error);
    return NextResponse.json(
      { success: false, message: 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}
