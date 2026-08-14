interface FeedbackValidationResult {
  isValid: boolean;
  error?: string;
}

interface FeedbackInput {
  type?: unknown;
  title?: unknown;
  description?: unknown;
  image?: unknown;
}

/**
 * Validate feedback type
 */
export function validateFeedbackType(type: unknown): FeedbackValidationResult {
  if (!type || !['bug', 'feature'].includes(type as string)) {
    return {
      isValid: false,
      error: 'Invalid issue type. Must be "bug" or "feature"'
    };
  }
  return { isValid: true };
}

/**
 * Validate feedback title
 */
export function validateTitle(title: unknown): FeedbackValidationResult {
  if (!title || typeof title !== 'string' || !title.trim()) {
    return {
      isValid: false,
      error: 'Title is required'
    };
  }

  if (title.length > 200) {
    return {
      isValid: false,
      error: 'Title must be less than 200 characters'
    };
  }

  return { isValid: true };
}

/**
 * Validate feedback description
 */
export function validateDescription(description: unknown): FeedbackValidationResult {
  if (!description || typeof description !== 'string' || !description.trim()) {
    return {
      isValid: false,
      error: 'Description is required'
    };
  }

  return { isValid: true };
}

/**
 * Validate image data (base64 string)
 */
export function validateImage(image: unknown): FeedbackValidationResult {
  if (!image) {
    return { isValid: true }; // Image is optional
  }

  if (typeof image !== 'string') {
    return {
      isValid: false,
      error: 'Image must be a string'
    };
  }

  // Check if it's a valid base64 string or URL
  const isBase64 = /^data:image\/(png|jpeg|jpg|gif|webp);base64,/.test(image);
  const isUrl = /^https?:\/\/.+/.test(image);

  if (!isBase64 && !isUrl) {
    return {
      isValid: false,
      error: 'Image must be a valid base64 string or URL'
    };
  }

  return { isValid: true };
}

/**
 * Validate all feedback input
 */
export function validateFeedback(input: FeedbackInput): FeedbackValidationResult {
  const typeValidation = validateFeedbackType(input.type);
  if (!typeValidation.isValid) {
    return typeValidation;
  }

  const titleValidation = validateTitle(input.title);
  if (!titleValidation.isValid) {
    return titleValidation;
  }

  const descriptionValidation = validateDescription(input.description);
  if (!descriptionValidation.isValid) {
    return descriptionValidation;
  }

  const imageValidation = validateImage(input.image);
  if (!imageValidation.isValid) {
    return imageValidation;
  }

  return { isValid: true };
}
