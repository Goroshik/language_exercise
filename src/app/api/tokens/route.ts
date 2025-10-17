import {NextRequest, NextResponse} from 'next/server';
import {userTokenRepository} from 'src/repository/client';
import {getUserTokensService, upsertUserTokenService} from 'src/services/userTokenService';
import {getUserIdFromRequest} from 'src/utils/auth';
import {safeJson} from 'src/utils/jsonWrapper';

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
    const userId = getUserIdFromRequest(request);
    const tokens = await getUserTokensService(userId);
    return NextResponse.json(tokens);
  } catch (error) {
    console.error(error)
    return NextResponse.json({error: 'Failed to fetch user tokens'}, {status: 500});
  }
}

// POST /api/tokens - Create or update a token for a service
export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    const body = await safeJson(request);
    const {service, token} = body;
    await upsertUserTokenService(userId, service, token);
    return NextResponse.json({success: true});
  } catch (error) {
    console.error(error)
    return NextResponse.json({error: 'Failed to save token'}, {status: 500});
  }
}

// DELETE /api/tokens - Delete a token for a specific service
export async function DELETE(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);


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
    console.error(error)
    console.error('Error deleting user token:', error);
    return NextResponse.json(
      {error: 'Failed to delete user token'},
      {status: 500}
    );
  }
}
