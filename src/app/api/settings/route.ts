import {NextRequest, NextResponse} from 'next/server';
import prisma from 'src/utils/prismaClient';


// NOTE: Type definitions for API requests
interface SettingsCreateRequest {
  userId: string;
  theme?: string;
  aiModel?: string;
  language?: string;
  translationLang?: string;
  customSettings?: Record<string, any>;
}

interface SettingsUpdateRequest {
  theme?: string;
  aiModel?: string;
  language?: string;
  translationLang?: string;
  customSettings?: Record<string, any>;
}

// GET /api/settings - Get user settings
export async function GET(request: NextRequest) {
  try {
    const {searchParams} = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        {error: 'User ID is required'},
        {status: 400}
      );
    }

    const userSettings = await prisma.userSettings.findUnique({
      where: {userId},
      select: {
        id: true,
        theme: true,
        aiModel: true,
        language: true,
        translationLang: true,
        customSettings: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!userSettings) {
      // Return default settings if none exist
      return NextResponse.json({
        theme: 'light',
        aiModel: 'gemini-2.5-flash',
        language: 'en',
        translationLang: 'RU',
        customSettings: {}
      });
    }

    return NextResponse.json(userSettings);
  } catch (error) {
    console.error('Error fetching user settings:', error);
    return NextResponse.json(
      {error: 'Failed to fetch user settings'},
      {status: 500}
    );
  }
}

// POST /api/settings - Create or update user settings
export async function POST(request: NextRequest) {
  try {
    const body: SettingsCreateRequest = await request.json();
    const {userId, theme, aiModel, language, translationLang, customSettings} = body;

    if (!userId) {
      return NextResponse.json(
        {error: 'User ID is required'},
        {status: 400}
      );
    }

    // Prepare update data (only include defined fields)
    const updateData: any = {
      updatedAt: new Date()
    };

    if (theme !== undefined) updateData.theme = theme;
    if (aiModel !== undefined) updateData.aiModel = aiModel;
    if (language !== undefined) updateData.language = language;
    if (translationLang !== undefined) updateData.translationLang = translationLang;
    if (customSettings !== undefined) updateData.customSettings = customSettings;

    console.log(body)


    // Use upsert to create or update settings
    const userSettings = await prisma.userSettings.upsert({
      where: {userId},
      update: updateData,
      create: {
        userId,
        theme: theme || 'light',
        aiModel: aiModel || 'gemini-2.5-flash',
        language: language || 'en',
        translationLang: translationLang || 'RU',
        customSettings: customSettings || {}
      }
    });

    return NextResponse.json({
      id: userSettings.id,
      theme: userSettings.theme,
      aiModel: userSettings.aiModel,
      language: userSettings.language,
      translationLang: userSettings.translationLang,
      customSettings: userSettings.customSettings,
      createdAt: userSettings.createdAt,
      updatedAt: userSettings.updatedAt
    });
  } catch (error) {
    console.error('Error creating/updating user settings:', error);
    return NextResponse.json(
      {error: 'Failed to save user settings'},
      {status: 500}
    );
  }
}

// PATCH /api/settings - Partially update user settings
export async function PATCH(request: NextRequest) {
  try {
    const {searchParams} = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        {error: 'User ID is required'},
        {status: 400}
      );
    }

    const body: SettingsUpdateRequest = await request.json();
    const {theme, aiModel, language, translationLang, customSettings} = body;

    // Prepare update data (only include defined fields)
    const updateData: any = {
      updatedAt: new Date()
    };

    if (theme !== undefined) updateData.theme = theme;
    if (aiModel !== undefined) updateData.aiModel = aiModel;
    if (language !== undefined) updateData.language = language;
    if (translationLang !== undefined) updateData.translationLang = translationLang;
    if (customSettings !== undefined) updateData.customSettings = customSettings;

    const userSettings = await prisma.userSettings.update({
      where: {userId},
      data: updateData
    });

    return NextResponse.json({
      id: userSettings.id,
      theme: userSettings.theme,
      aiModel: userSettings.aiModel,
      language: userSettings.language,
      translationLang: userSettings.translationLang,
      customSettings: userSettings.customSettings,
      updatedAt: userSettings.updatedAt
    });
  } catch (error) {
    console.error('Error updating user settings:', error);
    return NextResponse.json(
      {error: 'Failed to update user settings'},
      {status: 500}
    );
  }
}

// DELETE /api/settings - Reset user settings to defaults
export async function DELETE(request: NextRequest) {
  try {
    const {searchParams} = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        {error: 'User ID is required'},
        {status: 400}
      );
    }

    await prisma.userSettings.delete({
      where: {userId}
    });

    return NextResponse.json({message: 'User settings reset to defaults'});
  } catch (error) {
    console.error('Error deleting user settings:', error);
    return NextResponse.json(
      {error: 'Failed to reset user settings'},
      {status: 500}
    );
  }
}
