import { NextRequest, NextResponse } from 'next/server';
import { prismaService, TagItem } from 'src/services/prismaService';
import { DictionaryWord } from 'src/types';

export async function GET() {
  try {
    const words = await prismaService.getAllWords();
    return NextResponse.json({ success: true, words });
  } catch (error) {
    console.error('Failed to load words:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to load words',
      words: []
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { word, translate, tags } = await request.json();

    const newWord: DictionaryWord = {
      id: `user_${Date.now()}`,
      word: word.trim(),
      translate: translate.trim(),
      tags: tags.filter((tag: string) => tag.trim()),
      createdAt: new Date(),
    };

    // Save tags as TagItem entities
    const existingTags = await prismaService.getAllTags();
    const existingTagNames = existingTags.map(tag => tag.name);

    for (const tagName of newWord.tags) {
      if (!existingTagNames.includes(tagName)) {
        const newTag: TagItem = {
          id: `tag_${Date.now()}_${Math.random()}`,
          name: tagName,
          createdAt: new Date()
        };
        await prismaService.addTag(newTag);
      }
    }

    await prismaService.addWord(newWord);

    // Return updated tags as well
    const allTags = await prismaService.getAllTags();
    const tagsArray = allTags.map(tagItem => tagItem.name).sort();

    return NextResponse.json({
      success: true,
      word: newWord,
      allTags: tagsArray
    });
  } catch (error) {
    console.error('Failed to add word:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to add word'
    }, { status: 500 });
  }
}
