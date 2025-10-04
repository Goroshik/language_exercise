import { NextRequest, NextResponse } from 'next/server';
import { prismaService, TagItem } from 'src/services/prismaService';
import { DictionaryWord } from 'src/types';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { word, translate, tags } = await request.json();
    const { id } = params;

    // Get original word to preserve createdAt and isUserAdded
    const originalWord = await prismaService.getAllWords().then(words =>
      words.find(w => w.id === id)
    );

    const updatedWord: DictionaryWord = {
      id,
      word: word.trim(),
      translate: translate.trim(),
      tags: tags.filter((tag: string) => tag.trim()),
      createdAt: originalWord?.createdAt || new Date(),
    };

    // Save tags as TagItem entities
    const existingTags = await prismaService.getAllTags();
    const existingTagNames = existingTags.map(tag => tag.name);

    for (const tagName of updatedWord.tags) {
      if (!existingTagNames.includes(tagName)) {
        const newTag: TagItem = {
          id: `tag_${Date.now()}_${Math.random()}`,
          name: tagName,
          createdAt: new Date()
        };
        await prismaService.addTag(newTag);
      }
    }

    await prismaService.updateWord(updatedWord);

    // Return updated tags as well
    const allTags = await prismaService.getAllTags();
    const tagsArray = allTags.map(tagItem => tagItem.name).sort();

    return NextResponse.json({
      success: true,
      word: updatedWord,
      allTags: tagsArray
    });
  } catch (error) {
    console.error('Failed to update word:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update word'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    await prismaService.deleteWord(id);

    return NextResponse.json({
      success: true,
      deletedId: id
    });
  } catch (error) {
    console.error('Failed to remove word:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to remove word'
    }, { status: 500 });
  }
}
