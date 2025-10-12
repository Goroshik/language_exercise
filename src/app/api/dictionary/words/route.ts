import {NextRequest, NextResponse} from 'next/server';
import {wordRepository} from 'src/repository/word';
import {Prisma} from 'src/generated/prisma';
import {getUserIdOrUnauthorized, createUnauthorizedResponse} from 'src/utils/auth';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    // Проверяем аутентификацию
    const { userId, error } = await getUserIdOrUnauthorized(request);
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
    const { userId, error } = await getUserIdOrUnauthorized(request);
    if (error) {
      return createUnauthorizedResponse(error);
    }

    const {word, translate} = await request.json();

    if (!word || !translate) {
      return NextResponse.json({
        success: false,
        error: 'Word and translate are required'
      }, {status: 400});
    }

    const newWord: Prisma.WordCreateInput = {
      word: word.trim(),
      translate: translate.trim(),
      createdAt: new Date()
    };

    const createdWord = await wordRepository.addWord(userId, newWord);

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
