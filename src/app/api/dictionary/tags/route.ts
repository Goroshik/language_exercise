import { NextRequest, NextResponse } from 'next/server';
import { prismaService, TagItem } from 'src/services/prismaService';

export async function GET() {
  try {
    const tagItems = await prismaService.getAllTags();
    const tags = tagItems.map(tagItem => tagItem.name).sort();

    return NextResponse.json({
      success: true,
      tags
    });
  } catch (error) {
    console.error('Failed to get tags from database:', error);

    // Fallback to extracting from words if database fails
    try {
      const words = await prismaService.getAllWords();
      const allTags = new Set<string>();
      words.forEach(word => {
        word.tags.forEach(tag => allTags.add(tag));
      });

      const fallbackTags = Array.from(allTags).sort();
      return NextResponse.json({
        success: true,
        tags: fallbackTags
      });
    } catch (fallbackError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to load tags',
        tags: []
      }, { status: 500 });
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const { tags } = await request.json();

    if (!Array.isArray(tags)) {
      return NextResponse.json({
        success: false,
        error: 'Tags must be an array'
      }, { status: 400 });
    }

    const existingTags = await prismaService.getAllTags();
    const existingTagNames = existingTags.map(tag => tag.name);

    const newTagsAdded: string[] = [];

    for (const tagName of tags) {
      if (!existingTagNames.includes(tagName)) {
        const newTag: TagItem = {
          id: `tag_${Date.now()}_${Math.random()}`,
          name: tagName,
          createdAt: new Date()
        };
        await prismaService.addTag(newTag);
        newTagsAdded.push(tagName);
      }
    }

    // Return all tags after saving
    const allTags = await prismaService.getAllTags();
    const tagsArray = allTags.map(tagItem => tagItem.name).sort();

    return NextResponse.json({
      success: true,
      tags: tagsArray,
      newTagsAdded
    });
  } catch (error) {
    console.error('Failed to save tags:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to save tags'
    }, { status: 500 });
  }
}
