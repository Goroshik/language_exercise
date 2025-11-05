import Joi from 'joi';
import { ESSAY_PROMPTS } from 'src/prompts/essayPrompts';
import { essayRepository, languageRepository } from 'src/repository/client';
import { AIFactory } from 'src/services/aiFactory';
import { NextResponseError } from 'src/utils/NextResponseError';

export interface CheckEssayRequest {
  essayId: string;
  content: string;
  languageCode: string;
}

export interface EssayError {
  text: string;
  explanation: string;
  color: string;
  type: 'grammar' | 'punctuation' | 'style' | 'vocabulary';
}

export interface EssayCheckResponse {
  level: string;
  errors: EssayError[];
  summary: string;
}

export type ServiceResponse = { 
  status: number; 
  body: { 
    success?: boolean; 
    data?: EssayCheckResponse; 
    error?: string 
  } 
};

const schema = Joi.object({
  essayId: Joi.string().required(),
  content: Joi.string().required().min(10),
  languageCode: Joi.string().required()
});

export async function checkEssayService(
  rawBody: unknown,
  userId: string
): Promise<ServiceResponse> {
  try {
    const validation = schema.validate(rawBody, { abortEarly: false, stripUnknown: true });
    const { error, value } = validation as { error?: Joi.ValidationError; value: CheckEssayRequest };
    
    if (error) {
      const messages: string[] = (error.details || []).map((d: Joi.ValidationErrorItem) => 
        String(d.message)
      );
      return { status: 400, body: { error: messages.join('; ') } };
    }

    const body = value;
    const { essayId, content, languageCode } = body;

    // Verify essay exists and belongs to user
    const essay = await essayRepository.findByIdAndUser(essayId, userId);
    if (!essay) {
      throw new NextResponseError('Essay not found or access denied', 404);
    }

    // Get language name
    const languages = await languageRepository.findAll();
    const language = languages.find(l => l.code === languageCode);
    if (!language) {
      return { status: 400, body: { error: 'Invalid language code' } };
    }

    const prompt = ESSAY_PROMPTS.checkEssay(content, language.name);

    const aiService = await AIFactory.getAIService(userId);
    if (!aiService || typeof aiService.generateText !== 'function') {
      return { status: 502, body: { error: 'AI service not available for user' } };
    }

    let rawResult: unknown;
    try {
      rawResult = await aiService.generateText(prompt, userId);
    } catch (err) {
      if (err instanceof Error && err.message.includes('No token found')) {
        return { status: 402, body: { error: 'AI service token not configured for user' } };
      }
      return { status: 502, body: { error: 'Failed to generate response from AI service' } };
    }

    const text = typeof rawResult === 'string' 
      ? rawResult 
      : rawResult && typeof rawResult === 'object'
        ? (rawResult as { text?: string }).text ?? ''
        : '';

    // Parse AI response
    let aiResponse: EssayCheckResponse;
    try {
      // Try to extract JSON from potential markdown code blocks
      const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/```\s*([\s\S]*?)\s*```/);
      const jsonText = jsonMatch ? jsonMatch[1] : text;
      aiResponse = JSON.parse(jsonText.trim());
    } catch (_parseErr) {
      console.error('Failed to parse AI response:', text);
      return { 
        status: 500, 
        body: { error: 'Failed to parse AI response. Please try again.' } 
      };
    }

    // Save AI response to database
    await essayRepository.update(essayId, {
      aiResponse: JSON.stringify(aiResponse),
      level: aiResponse.level
    });

    return { 
      status: 200, 
      body: { 
        success: true, 
        data: aiResponse 
      } 
    };
  } catch (err) {
    if (err instanceof NextResponseError) {
      return { status: err.status, body: { error: err.message } };
    }
    console.error('Unexpected error in checkEssay service:', err);
    return { status: 500, body: { error: 'Internal server error' } };
  }
}
