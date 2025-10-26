import { NextResponse } from 'next/server';
import { prisma } from 'src/repository/client';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Check database connection by attempting to count users
    // This works with MongoDB and validates the connection
    await prisma.user.findFirst();

    return NextResponse.json(
      {
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: 'connected'
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 503 }
    );
  }
}
