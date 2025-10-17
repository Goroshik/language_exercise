import { NextResponse } from 'next/server';
import { getLanguagesService } from 'src/services/languageService';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const languages = await getLanguagesService();
    return NextResponse.json({ success: true, data: languages });
  } catch (error) {
    console.error('Error fetching languages:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch languages', data: [] },
      { status: 500 }
    );
  }
}
