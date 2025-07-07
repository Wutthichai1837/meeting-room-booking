import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { hashPassword, validateEmail, validatePassword, validatePhone } from '@/lib/auth';

// Add CORS headers
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders(),
  });
}

export async function POST(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json();
    } catch (jsonError) {
      console.error('JSON parsing error:', jsonError);
      return NextResponse.json(
        { success: false, message: 'ข้อมูลที่ส่งมาไม่ถูกต้อง' },
        { status: 400 }
      );
    }

    const { username, email, password, firstName, lastName, phone, department } = body;

    // Log received data for debugging
    console.log('Registration data received:', {
      username,
      email,
      password: password ? '[HIDDEN]' : undefined,
      firstName,
      lastName,
      phone,
      department
    });

    // Validation
    if (!username || !email || !password || !firstName || !lastName || !department) {
      console.log('Missing required fields:', {
        username: !username,
        email: !email,
        password: !password,
        firstName: !firstName,
        lastName: !lastName,
        department: !department
      });
      return NextResponse.json(
        { success: false, message: 'กรุณากรอกข้อมูลให้ครบถ้วน' },
        { status: 400 }
      );
    }

    // Validate username
    if (username.length < 3) {
      return NextResponse.json(
        { success: false, message: 'Username ต้องมีอย่างน้อย 3 ตัวอักษร' },
        { status: 400 }
      );
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return NextResponse.json(
        { success: false, message: 'Username สามารถใช้ได้เฉพาะตัวอักษร ตัวเลข และเครื่องหมาย _' },
        { status: 400 }
      );
    }

    // Validate email format
    if (!validateEmail(email)) {
      return NextResponse.json(
        { success: false, message: 'รูปแบบอีเมลไม่ถูกต้อง' },
        { status: 400 }
      );
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { success: false, message: passwordValidation.message },
        { status: 400 }
      );
    }

    // Validate phone if provided
    if (phone && !validatePhone(phone)) {
      return NextResponse.json(
        { success: false, message: 'รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง' },
        { status: 400 }
      );
    }

    // Validate department
    const validDepartments = ['IT', 'HR&Admin', 'Sales&Marketing', 'DocInbound', 'DocOutbound', 'Accounting', 'CS', 'ECD', 'Operation','Jiaxiang'];
    if (!validDepartments.includes(department)) {
      return NextResponse.json(
        { success: false, message: 'แผนกที่เลือกไม่ถูกต้อง' },
        { status: 400 }
      );
    }

    // Check if username already exists
    try {
      const existingUsername = await db.queryRow(
        'SELECT id FROM users WHERE username = ?',
        [username]
      );

      if (existingUsername) {
        return NextResponse.json(
          { success: false, message: 'Username นี้ถูกใช้งานแล้ว' },
          { status: 409 }
        );
      }
    } catch (dbError) {
      console.error('Database error checking username:', dbError);
      return NextResponse.json(
        { success: false, message: 'เกิดข้อผิดพลาดในการตรวจสอบฐานข้อมูล' },
        { status: 500 }
      );
    }

    // Check if email already exists
    try {
      const existingUser = await db.queryRow(
        'SELECT id FROM users WHERE email = ?',
        [email]
      );

      if (existingUser) {
        return NextResponse.json(
          { success: false, message: 'อีเมลนี้ถูกใช้งานแล้ว' },
          { status: 409 }
        );
      }
    } catch (dbError) {
      console.error('Database error checking email:', dbError);
      return NextResponse.json(
        { success: false, message: 'เกิดข้อผิดพลาดในการตรวจสอบฐานข้อมูล' },
        { status: 500 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create new user (email_verified = true by default)
    try {
      const result = await db.query(
        `INSERT INTO users (username, email, password_hash, first_name, last_name, phone, department, role, email_verified, is_active, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, 'user', TRUE, 1, NOW())`,
        [username, email, hashedPassword, firstName, lastName, phone || null, department]
      ) as any;

      const userId = result.insertId;

      // Return success response
      return NextResponse.json({
        success: true,
        message: 'ลงทะเบียนสำเร็จ สามารถเข้าสู่ระบบได้ทันที',
        data: {
          userId: userId,
          username: username,
          email: email,
          firstName: firstName,
          lastName: lastName
        }
      }, { 
        status: 201,
        headers: corsHeaders()
      });

    } catch (dbError) {
      console.error('Database error creating user:', dbError);
      return NextResponse.json(
        { success: false, message: 'เกิดข้อผิดพลาดในการสร้างผู้ใช้' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในระบบ' },
      { status: 500 }
    );
  }
}
