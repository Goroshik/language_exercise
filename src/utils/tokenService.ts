import prisma from 'src/utils/prismaClient';

export interface TokenResult {
  token: string | null;
  error?: string;
}

/**
 * Universal token service for retrieving user tokens from database
 */
export class TokenService {
  /**
   * Get token for a specific service by user ID
   * @param userId - User ID from middleware
   * @param service - Service name (e.g., 'gemini', 'deepl', etc.)
   * @returns Promise with token or null if not found
   */
  static async getToken(userId: string, service: string): Promise<TokenResult> {
    try {
      const userToken = await prisma.userToken.findUnique({
        where: {
          userId_service: {
            userId,
            service
          }
        },
        select: {
          encryptedToken: true
        }
      });

      if (!userToken) {
        return {
          token: null,
          error: `No token found for service: ${service}`
        };
      }

      // Return the encrypted token (assuming it's stored as plain text based on the existing API)
      return {
        token: userToken.encryptedToken
      };
    } catch (error) {
      console.error(`Error fetching token for service ${service}:`, error);
      return {
        token: null,
        error: `Failed to retrieve token for service: ${service}`
      };
    }
  }

  /**
   * Get user ID from request headers (set by middleware)
   * @param request - NextRequest object
   * @returns User ID or null if not found
   */
  static getUserIdFromRequest(request: Request): string | null {
    const userId = request.headers.get('x-user-id');
    return userId;
  }
}

export default TokenService;
