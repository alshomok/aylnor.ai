import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get IP from various headers (in case of proxy/load balancer)
    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const cfConnectingIp = request.headers.get('cf-connecting-ip');
    
    let ip = forwarded?.split(',')[0]?.trim() 
          || realIp 
          || cfConnectingIp 
          || request.headers.get('x-client-ip')
          || 'unknown';

    // Remove port if present
    ip = ip.split(':')[0];

    return NextResponse.json({ ip });
  } catch (error) {
    console.error('Error getting IP:', error);
    return NextResponse.json({ ip: 'unknown' });
  }
}
