import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    ok: true, 
    timestamp: new Date().toISOString(),
    message: 'API is healthy'
  });
}