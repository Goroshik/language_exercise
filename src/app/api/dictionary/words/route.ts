import {NextRequest, NextResponse} from 'next/server';
import {wordRepository} from 'src/repository/client';
import {Prisma} from 'src/generated/prisma';
import {getUserIdOrUnauthorized, createUnauthorizedResponse} from 'src/utils/auth';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    // Проверяем аутентификацию
    const {userId, error} = await getUserIdOrUnauthorized(request);
    if (error) {
      return createUnauthorizedResponse(error);
    }

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query') || '';

    const words = await wordRepository.searchWords(userId, query);
    return NextResponse.json({success: true, words});
  } catch (error) {
    console.error('Failed to load words:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to load words',
      words: []
    }, {status: 500});
  }
}

export async function POST(request: NextRequest) {
  try {
    // Проверяем аутентификацию
    const {userId, error} = await getUserIdOrUnauthorized(request);
    if (error) {
      return createUnauthorizedResponse(error);
    }

    const {words} = await request.json();

    console.log(words);

    if (!words.length) {
      return NextResponse.json({
        success: false,
        error: 'Word and translate are required'
      }, {status: 400});
    }


    const createdWord = await wordRepository.addManyWord(userId, words);

    return NextResponse.json({
      success: true,
      word: createdWord,
    });
  } catch (error) {
    console.error('Failed to add word:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to add word'
    }, {status: 500});
  }
}
