import { NextResponseError } from 'src/utils/NextResponseError';
import { AIFactory } from './aiFactory';

export async function getTextStream(prompt: string, userId: string) {
  if (!prompt || typeof prompt !== 'string') {
    throw new NextResponseError('Prompt parameter is required and must be a string', 400);
  }
  const aiService = await AIFactory.getAIService(userId);
  // TODO: Fix type - ensure all AI services implement generateTextStream instead of non-null assertion
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return aiService.generateTextStream!(prompt, userId);
}

export function createEventStream(textStream: AsyncIterable<string>) {
  const encoder = new TextEncoder();
  return new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of textStream) {
          const data = `data: ${JSON.stringify({ chunk })}\n\n`;
          controller.enqueue(encoder.encode(data));
        }
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
        controller.close();
      } catch (_error) {
        const errorData = `data: ${JSON.stringify({ error: 'Stream error occurred' })}\n\n`;
        controller.enqueue(encoder.encode(errorData));
        controller.close();
      }
    }
  });
}
