import { NextRequest, NextResponse } from 'next/server';

import { createFeedbackService } from 'src/services/feedbackService';
import { validateFeedback } from 'src/utils/feedbackValidation';
import { processImageForGitHub } from 'src/utils/imageUpload';
import { safeJson } from 'src/utils/jsonWrapper';

/**
 * POST /api/feedback - Create a GitHub issue from user feedback
 *
 * Request body:
 * - type: 'bug' | 'feature'
 * - title: string (max 200 chars)
 * - description: string
 * - image?: string (optional base64 or URL)
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await safeJson(request);
    const { type, title, description, image } = body;

    // Validate input
    const validation = validateFeedback({ type, title, description, image });
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Process image if provided
    let imageUrl: string | undefined;
    if (image) {
      try {
        const result = processImageForGitHub(image);
        imageUrl = result.url;
      } catch (error) {
        console.error('Error processing image:', error);
        // Continue without image if processing fails
        imageUrl = undefined;
      }
    }

    // Create feedback service
    const feedbackService = createFeedbackService();

    // Create GitHub issue
    const result = await feedbackService.createIssue({
      type,
      title: title.trim(),
      description: description.trim(),
      imageUrl
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error creating GitHub issue:', error);

    // Handle configuration errors
    if (error instanceof Error && error.message.includes('GITHUB_TOKEN')) {
      return NextResponse.json({ error: 'GitHub integration is not configured' }, { status: 500 });
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to create issue'
      },
      { status: 500 }
    );
  }
}
