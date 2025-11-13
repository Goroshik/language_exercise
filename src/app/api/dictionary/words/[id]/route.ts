import { NextRequest, NextResponse } from 'next/server';
import { wordRepository } from 'src/repository/client';
import { deleteWordService, updateWordService } from 'src/services/wordService';
import { getUserIdFromRequest } from 'src/utils/auth';
import { safeJson } from 'src/utils/jsonWrapper';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = getUserIdFromRequest(request);
    const { word, translate } = await safeJson(request);
    const { id } = await params;
    const originalWord = await wordRepository
      .getAllWords(userId)
      .then(words => words.find(w => w?.id === id));
    const updatedWord = await updateWordService(
      userId,
      id,
      word,
      translate,
      originalWord?.createdAt
    );
    return NextResponse.json({ success: true, word: updatedWord });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to update word' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserIdFromRequest(request);
    const { id } = await params;
    await deleteWordService(userId, id);
    return NextResponse.json({ success: true, deletedId: id });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to delete word' },
      { status: 500 }
    );
  }
}
