import { describe, expect, it } from 'vitest';
import {
  validateDescription,
  validateFeedback,
  validateFeedbackType,
  validateImage,
  validateTitle
} from './feedbackValidation';

describe('validateFeedbackType', () => {
  it.each(['bug', 'feature'])('accepts %s', type => {
    expect(validateFeedbackType(type)).toEqual({ isValid: true });
  });

  it('rejects an unknown type', () => {
    expect(validateFeedbackType('question').error).toMatch(/Invalid issue type/);
  });

  it('rejects a missing type', () => {
    expect(validateFeedbackType(undefined).isValid).toBe(false);
  });

  it('rejects an empty string', () => {
    expect(validateFeedbackType('').isValid).toBe(false);
  });
});

describe('validateTitle', () => {
  it('accepts a normal title', () => {
    expect(validateTitle('Crash on login')).toEqual({ isValid: true });
  });

  it('accepts a title of exactly 200 characters', () => {
    expect(validateTitle('a'.repeat(200)).isValid).toBe(true);
  });

  it('rejects a title of 201 characters', () => {
    expect(validateTitle('a'.repeat(201)).error).toMatch(/less than 200/);
  });

  it('rejects whitespace only', () => {
    expect(validateTitle('   ').error).toMatch(/required/);
  });

  it('rejects a non-string', () => {
    expect(validateTitle(42).isValid).toBe(false);
  });

  it('rejects a missing title', () => {
    expect(validateTitle(null).isValid).toBe(false);
  });
});

describe('validateDescription', () => {
  it('accepts a normal description', () => {
    expect(validateDescription('It crashes')).toEqual({ isValid: true });
  });

  it('has no length limit', () => {
    expect(validateDescription('a'.repeat(5000)).isValid).toBe(true);
  });

  it('rejects whitespace only', () => {
    expect(validateDescription('  \n ').error).toMatch(/required/);
  });

  it('rejects a non-string', () => {
    expect(validateDescription({}).isValid).toBe(false);
  });
});

describe('validateImage', () => {
  it('treats a missing image as valid', () => {
    expect(validateImage(undefined)).toEqual({ isValid: true });
  });

  it('treats an empty string as valid', () => {
    expect(validateImage('').isValid).toBe(true);
  });

  it.each(['png', 'jpeg', 'jpg', 'gif', 'webp'])('accepts a base64 %s payload', format => {
    expect(validateImage(`data:image/${format};base64,AAAA`).isValid).toBe(true);
  });

  it('rejects a base64 payload of an unsupported format', () => {
    expect(validateImage('data:image/bmp;base64,AAAA').isValid).toBe(false);
  });

  it.each(['http://example.com/a.png', 'https://example.com/a.png'])('accepts %s', url => {
    expect(validateImage(url).isValid).toBe(true);
  });

  it('rejects a bare file path', () => {
    expect(validateImage('/tmp/a.png').error).toMatch(/base64 string or URL/);
  });

  it('rejects a non-string image', () => {
    expect(validateImage(123).error).toMatch(/must be a string/);
  });
});

describe('validateFeedback', () => {
  const valid = { type: 'bug', title: 'Crash', description: 'It crashes' };

  it('accepts a complete payload without an image', () => {
    expect(validateFeedback(valid)).toEqual({ isValid: true });
  });

  it('accepts a complete payload with an image', () => {
    expect(validateFeedback({ ...valid, image: 'https://example.com/a.png' }).isValid).toBe(true);
  });

  it('reports the type error first', () => {
    expect(validateFeedback({ ...valid, type: 'nope', title: '' }).error).toMatch(
      /Invalid issue type/
    );
  });

  it('reports the title error before the description', () => {
    expect(validateFeedback({ ...valid, title: '', description: '' }).error).toMatch(/Title/);
  });

  it('reports the description error before the image', () => {
    expect(validateFeedback({ ...valid, description: '', image: 123 }).error).toMatch(
      /Description/
    );
  });

  it('reports an invalid image last', () => {
    expect(validateFeedback({ ...valid, image: 123 }).error).toMatch(/Image/);
  });
});
