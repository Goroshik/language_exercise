import {NextRequest, NextResponse} from 'next/server';
import {userTokenRepository} from 'src/repository/client';
import {getUserIdFromRequest, createUnauthorizedResponse} from 'src/utils/auth';

// NOTE: Type definitions for API requests
interface TokenCreateRequest {
  service: string;
  token: string;
}

interface TokenUpdateRequest {
  service: string;
  token: string;
}

// GET /api/tokens - Get all tokens for a user (decrypted)
export async function GET(request: NextRequest) {
  try {
    // Проверяем аутентификацию
    const {userId, error} = getUserIdFromRequest(request);

    if (error) {
      return createUnauthorizedResponse(error);
    }

    const userTokens = await userTokenRepository.findByUser(userId);

    // Tokens are already decrypted by the repository
    const decryptedTokens = userTokens.map(tokenData => ({
      id: tokenData.id,
      service: tokenData.service,
      token: tokenData.token,
      createdAt: tokenData.createdAt,
      updatedAt: tokenData.updatedAt
    }));

    return NextResponse.json(decryptedTokens);
  } catch (error) {
    console.error('Error fetching user tokens:', error);
    return NextResponse.json(
      {error: 'Failed to fetch user tokens'},
      {status: 500}
    );
  }
}

// POST /api/tokens - Create or update a token for a service
export async function POST(request: NextRequest) {
  try {
    // Проверяем аутентификацию
    const {userId, error} = getUserIdFromRequest(request);
    if (error) {
      return createUnauthorizedResponse(error);
    }

    const body: TokenCreateRequest = await request.json();
    const {service, token} = body;

    if (!service || !token) {
      return NextResponse.json(
        {error: 'Service and token are required'},
        {status: 400}
      );
    }

    // Use upsert to create or update the token
    const userToken = await userTokenRepository.upsert(userId, service, token);

    return NextResponse.json({
      id: userToken.id,
      service: userToken.service,
      createdAt: userToken.createdAt,
      updatedAt: userToken.updatedAt
    });
  } catch (error) {
    console.error('Error creating/updating user token:', error);
    return NextResponse.json(
      {error: 'Failed to save user token'},
      {status: 500}
    );
  }
}

// DELETE /api/tokens - Delete a token for a specific service
export async function DELETE(request: NextRequest) {
  try {
    // Проверяем аутентификацию
    const {userId, error} = getUserIdFromRequest(request);
    if (error) {
      return createUnauthorizedResponse(error);
    }

    const {searchParams} = new URL(request.url);
    const service = searchParams.get('service');

    if (!service) {
      return NextResponse.json(
        {error: 'Service is required'},
        {status: 400}
      );
    }

    // Find the token first, then delete by id
    const token = await userTokenRepository.findByUserAndService(userId, service);
    if (!token) {
      return NextResponse.json(
        {error: 'Token not found'},
        {status: 404}
      );
    }

    await userTokenRepository.delete(token.id);

    return NextResponse.json({message: 'Token deleted successfully'});
  } catch (error) {
    console.error('Error deleting user token:', error);
    return NextResponse.json(
      {error: 'Failed to delete user token'},
      {status: 500}
    );
  }
}
