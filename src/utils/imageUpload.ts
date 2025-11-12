/**
 * Utility for handling image uploads for feedback
 */

interface ImageUploadResult {
  url: string;
}

/**
 * Convert base64 image to a format suitable for GitHub
 * GitHub issues support image URLs, so we'll return the base64 data URL
 * which can be embedded directly in markdown
 */
export function processImageForGitHub(imageData: string): ImageUploadResult {
  // If it's already a URL, return it as is
  if (imageData.startsWith('http://') || imageData.startsWith('https://')) {
    return { url: imageData };
  }
  
  // If it's a base64 string, it can be used directly in GitHub markdown
  // GitHub will handle the display
  if (imageData.startsWith('data:image/')) {
    return { url: imageData };
  }
  
  throw new Error('Invalid image format');
}

/**
 * Validate image size (optional, for future use)
 */
export function validateImageSize(base64String: string, maxSizeInMB = 5): boolean {
  try {
    // Remove the data URL prefix to get just the base64 data
    const base64Data = base64String.split(',')[1] || base64String;
    
    // Calculate size in bytes (base64 is ~4/3 of original size)
    const sizeInBytes = (base64Data.length * 3) / 4;
    const sizeInMB = sizeInBytes / (1024 * 1024);
    
    return sizeInMB <= maxSizeInMB;
  } catch {
    return false;
  }
}
