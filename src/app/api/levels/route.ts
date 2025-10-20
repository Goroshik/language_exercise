import { NextResponse } from 'next/server';
import { getLevelsService } from 'src/services/levelService';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const levels = await getLevelsService();
    return NextResponse.json({ success: true, data: levels });
  } catch (error) {
    console.error('Error fetching levels:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch levels', data: [] },
      { status: 500 }
    );
  }
}
