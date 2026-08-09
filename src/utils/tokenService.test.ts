import { beforeEach, describe, expect, it, vi } from 'vitest';

const findByUserAndService = vi.fn();
const alertError = vi.fn();

vi.mock('src/repository/client', () => ({
  userTokenRepository: {
    findByUserAndService: (...args: unknown[]) => findByUserAndService(...args)
  }
}));

vi.mock('src/utils/alert', () => ({
  showAlert: { error: (...args: unknown[]) => alertError(...args) }
}));

const { TokenService } = await import('./tokenService');

beforeEach(() => {
  vi.clearAllMocks();
});

describe('TokenService.getToken', () => {
  it('returns the stored token', async () => {
    findByUserAndService.mockResolvedValue({ token: 'secret' });
    await expect(TokenService.getToken('u1', 'deepl')).resolves.toEqual({ token: 'secret' });
  });

  it('looks the token up by user and service', async () => {
    findByUserAndService.mockResolvedValue({ token: 'secret' });
    await TokenService.getToken('u1', 'deepl');
    expect(findByUserAndService).toHaveBeenCalledWith('u1', 'deepl');
  });

  it('reports a missing token without alerting', async () => {
    findByUserAndService.mockResolvedValue(null);

    await expect(TokenService.getToken('u1', 'deepl')).resolves.toEqual({
      token: null,
      error: 'No token found for service: deepl'
    });
    expect(alertError).not.toHaveBeenCalled();
  });

  it('swallows a repository failure and alerts instead', async () => {
    findByUserAndService.mockRejectedValue(new Error('db down'));

    await expect(TokenService.getToken('u1', 'deepl')).resolves.toEqual({
      token: null,
      error: 'Failed to retrieve token for service: deepl'
    });
    expect(alertError).toHaveBeenCalledOnce();
  });

  it('distinguishes "not found" from "lookup failed"', async () => {
    findByUserAndService.mockResolvedValue(null);
    const missing = await TokenService.getToken('u1', 'deepl');

    findByUserAndService.mockRejectedValue(new Error('db down'));
    const failed = await TokenService.getToken('u1', 'deepl');

    expect(missing.error).not.toBe(failed.error);
  });
});

describe('TokenService.getUserIdFromRequest', () => {
  it('returns the header value', () => {
    const request = { headers: { get: () => 'user-1' } } as unknown as Request;
    expect(TokenService.getUserIdFromRequest(request)).toBe('user-1');
  });

  it('returns null when the header is absent', () => {
    const request = { headers: { get: () => null } } as unknown as Request;
    expect(TokenService.getUserIdFromRequest(request)).toBeNull();
  });
});
