import {NextRequest, NextResponse} from 'next/server';
import {wordRepository} from 'src/repository/client';
import {DictionaryWord} from 'src/types';
import {getUserIdFromRequest, createUnauthorizedResponse} from 'src/utils/auth';

export async function PUT(request: NextRequest, {params}: { params: { id: string } }) {
  try {
    // Проверяем аутентификацию
    const { userId, error } = getUserIdFromRequest(request);
    if (error) {
      return createUnauthorizedResponse(error);
    }

    const {word, translate} = await request.json();
    const {id} = params;

    // Get original word to preserve createdAt
    const originalWord = await wordRepository.getAllWords(userId).then(words =>
      words.find(w => w.id === id)
    );

    const updatedWord: DictionaryWord = {
      id,
      word: word.trim(),
      translate: translate.trim(),
      createdAt: originalWord?.createdAt || new Date(),
    };

    await wordRepository.updateWord(userId, updatedWord);

    return NextResponse.json({
      success: true,
      word: updatedWord
    });
  } catch (error) {
    console.error('Failed to update word:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update word'
    }, {status: 500});
  }
}

export async function DELETE(request: NextRequest, {params}: { params: { id: string } }) {
  try {
    // Проверяем аутентификацию
    const { userId, error } = getUserIdFromRequest(request);
    if (error) {
      return createUnauthorizedResponse(error);
    }

    const {id} = params;

    await wordRepository.deleteWord(userId, id);

    return NextResponse.json({
      success: true,
      deletedId: id
    });
  } catch (error) {
    console.error('Failed to remove word:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to remove word'
    }, {status: 500});
  }
}
