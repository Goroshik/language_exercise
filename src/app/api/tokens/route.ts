import {NextRequest, NextResponse} from 'next/server';
import prisma from 'src/utils/prismaClient';

// NOTE: Type definitions for API requests
interface TokenCreateRequest {
  userId: string;
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
    const {searchParams} = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        {error: 'User ID is required'},
        {status: 400}
      );
    }

    const userTokens = await prisma.userToken.findMany({
      where: {userId},
      select: {
        id: true,
        service: true,
        createdAt: true,
        updatedAt: true,
        encryptedToken: true
      }
    });

    // Decrypt tokens for response
    const decryptedTokens = userTokens.map(token => ({
      id: token.id,
      service: token.service,
      token: token.encryptedToken,
      createdAt: token.createdAt,
      updatedAt: token.updatedAt
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
    const body: TokenCreateRequest = await request.json();
    const {userId, service, token} = body;

    if (!userId || !service || !token) {
      return NextResponse.json(
        {error: 'User ID, service, and token are required'},
        {status: 400}
      );
    }


    console.log('=================', userId, service, token)

    // Use upsert to create or update the token
    const userToken = await prisma.userToken.upsert({
      where: {
        userId_service: {
          userId,
          service
        }
      },
      update: {
        encryptedToken: token,
        updatedAt: new Date()
      },
      create: {
        service,
        encryptedToken: token,
        userId
      }
    });

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
    const {searchParams} = new URL(request.url);
    const userId = searchParams.get('userId');
    const service = searchParams.get('service');

    if (!userId || !service) {
      return NextResponse.json(
        {error: 'User ID and service are required'},
        {status: 400}
      );
    }

    await prisma.userToken.delete({
      where: {
        userId_service: {
          userId,
          service
        }
      }
    });

    return NextResponse.json({message: 'Token deleted successfully'});
  } catch (error) {
    console.error('Error deleting user token:', error);
    return NextResponse.json(
      {error: 'Failed to delete user token'},
      {status: 500}
    );
  }
}
