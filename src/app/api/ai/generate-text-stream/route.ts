import { NextRequest, NextResponse } from 'next/server';
import { GoogleAIService } from 'src/services/googleAI';
import { TokenService } from 'src/utils/tokenService';

interface GenerateTextStreamRequest {
  prompt: string;
}

// POST /api/ai/generate-text-stream - Generate text using AI with streaming response
export async function POST(request: NextRequest) {
  try {
    // Get user ID from middleware headers
    const userId = TokenService.getUserIdFromRequest(request);

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
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
    const googleAI = new GoogleAIService();
    const textStream = await googleAI.generateTextStream(prompt, userId);

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
        { error: 'Google AI token not configured for user' },
        { status: 402 } // Payment Required - indicates missing token
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
