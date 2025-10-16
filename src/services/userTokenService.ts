import { userTokenRepository } from 'src/repository/client';

export async function getUserTokensService(userId: string) {
  const userTokens = await userTokenRepository.findByUser(userId);
  return userTokens.map(tokenData => ({
    id: tokenData.id,
    service: tokenData.service,
    token: tokenData.token,
    createdAt: tokenData.createdAt,
    updatedAt: tokenData.updatedAt
  }));
}

export async function upsertUserTokenService(userId: string, service: string, token: string) {
  if (!service || !token) {
    throw new Error('Service and token are required');
  }
  return userTokenRepository.upsert(userId, service, token);
}

export async function deleteUserTokenService(userId: string, service: string) {
  return userTokenRepository.delete(userId, service);
}
