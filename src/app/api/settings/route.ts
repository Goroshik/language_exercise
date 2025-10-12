import {NextRequest, NextResponse} from 'next/server';

import {userSettingsRepository} from 'src/repository/userSettings';
import {getUserIdFromRequest, createUnauthorizedResponse} from 'src/utils/auth';


// NOTE: Type definitions for API requests
interface SettingsRequest {
  theme: string;
  aiModel: string;
  language: string;
  translationLang: string;
  customSettings: Record<string, any>;
}


// GET /api/settings - Get user settings
export async function GET(request: NextRequest) {
  try {
    // Проверяем аутентификацию
    const { userId, error } = getUserIdFromRequest(request);
    if (error) {
      return createUnauthorizedResponse(error);
    }

    const userSettings = await userSettingsRepository.findByUserId(userId);

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
    // Проверяем аутентификацию
    const { userId, error } = getUserIdFromRequest(request);
    if (error) {
      return createUnauthorizedResponse(error);
    }

    const body: SettingsRequest = await request.json();
    const {theme, aiModel, language, translationLang, customSettings} = body;

    const result = await userSettingsRepository.upsert(userId, body);

    return NextResponse.json(result);
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
    // Проверяем аутентификацию
    const { userId, error } = getUserIdFromRequest(request);
    if (error) {
      return createUnauthorizedResponse(error);
    }

    const body: SettingsRequest = await request.json();
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

    const userSettings = await userSettingsRepository.update(userId, updateData);

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
    // Проверяем аутентификацию
    const { userId, error } = getUserIdFromRequest(request);
    if (error) {
      return createUnauthorizedResponse(error);
    }

    await userSettingsRepository.delete(userId);

    return NextResponse.json({message: 'User settings reset to defaults'});
  } catch (error) {
    console.error('Error deleting user settings:', error);
    return NextResponse.json(
      {error: 'Failed to reset user settings'},
      {status: 500}
    );
  }
}
