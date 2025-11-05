import { NextRequest, NextResponse } from 'next/server';

import {
  deleteUserSettingsService,
  getUserSettingsService,
  updateUserSettingsService,
  upsertUserSettingsService
} from 'src/services/userSettingsService';
import { getUserIdFromRequest } from 'src/utils/auth';
import { safeJson } from 'src/utils/jsonWrapper';



// GET /api/settings - Get user settings
export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    const userSettings = await getUserSettingsService(userId);
    return NextResponse.json(userSettings);
  } catch (_error) {
    return NextResponse.json({ error: 'Failed to fetch user settings' }, { status: 500 });
  }
}

// POST /api/settings - Create or update user settings
export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    const body = await safeJson(request);
    const result = await upsertUserSettingsService(userId, body);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in POST /api/settings:', error);
    return NextResponse.json({ error: 'Failed to save user settings' }, { status: 500 });
  }
}

// PATCH /api/settings - Partially update user settings
export async function PATCH(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    const body = await safeJson(request);
    const updateData = { ...body, updatedAt: new Date() };
    const userSettings = await updateUserSettingsService(userId, updateData);
    return NextResponse.json(userSettings);
  } catch (_error) {
    return NextResponse.json({ error: 'Failed to update user settings' }, { status: 500 });
  }
}

// DELETE /api/settings - Reset user settings to defaults
export async function DELETE(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    const result = await deleteUserSettingsService(userId);
    return NextResponse.json(result);
  } catch (_error) {
    return NextResponse.json({ error: 'Failed to reset user settings' }, { status: 500 });
  }
}
