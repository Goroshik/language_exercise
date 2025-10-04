import { NextRequest, NextResponse } from 'next/server';
import { prismaService, TagItem } from 'src/services/prismaService';

export async function POST() {
  try {
    await prismaService.init();

    // Load words from PostgreSQL database
    const words = await prismaService.getAllWords();

    // Check if tags table is empty and populate with unique tags from words
    const existingTags = await prismaService.getAllTags();
    if (existingTags.length === 0) {
      // Extract unique tags from all words
      const allTags = new Set<string>();
      words.forEach(word => {
        word.tags.forEach(tag => allTags.add(tag));
      });

      // Save unique tags to database
      const uniqueTags = Array.from(allTags);
      if (uniqueTags.length > 0) {
        for (const tagName of uniqueTags) {
          const newTag: TagItem = {
            id: `tag_${Date.now()}_${Math.random()}`,
            name: tagName,
            createdAt: new Date()
          };
          await prismaService.addTag(newTag);
        }
      }
    }

    // Load all tags
    const allTags = await prismaService.getAllTags();
    const tags = allTags.map(tagItem => tagItem.name).sort();

    return NextResponse.json({
      success: true,
      words,
      allTags: tags
    });
  } catch (error) {
    console.error('Failed to initialize PostgreSQL database:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to initialize database',
      words: [],
      allTags: []
    }, { status: 500 });
  }
}
