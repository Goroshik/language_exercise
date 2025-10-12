import { NextRequest, NextResponse } from 'next/server';
import { AIFactory } from 'src/services/aiFactory';
import { getUserIdFromRequest, createUnauthorizedResponse } from 'src/utils/auth';

interface GenerateTextStreamRequest {
  prompt: string;
}

// POST /api/ai/generate-text-stream - Generate text using AI with streaming response
export async function POST(request: NextRequest) {
  try {
    // Проверяем аутентификацию
    const { userId, error } = getUserIdFromRequest(request);
    if (error) {
      return createUnauthorizedResponse(error);
    }

    // Parse request body
    const body: GenerateTextStreamRequest = await request.json();
    const { prompt } = body;

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Prompt parameter is required and must be a string' },
        { status: 400 }
      );
    }

    // Create service instance and get streaming response
    const aiService = await AIFactory.getAIService(userId);
    const textStream = await aiService.generateTextStream!(prompt, userId);

    // Create streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of textStream) {
            // Send chunk as Server-Sent Event format
            const data = `data: ${JSON.stringify({ chunk })}\n\n`;
            controller.enqueue(encoder.encode(data));
          }

          // Send completion signal
          const endData = `data: ${JSON.stringify({ done: true })}\n\n`;
          controller.enqueue(encoder.encode(endData));
          controller.close();
        } catch (error) {
          console.error('Error in streaming:', error);
          const errorData = `data: ${JSON.stringify({ error: 'Stream error occurred' })}\n\n`;
          controller.enqueue(encoder.encode(errorData));
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });

  } catch (error) {
    console.error('Error in generate-text-stream API:', error);

    // Handle specific token errors
    if (error instanceof Error && error.message.includes('No token found')) {
      return NextResponse.json(
        { error: 'AI service token not configured for user' },
        { status: 402 } // Payment Required - indicates missing token
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
