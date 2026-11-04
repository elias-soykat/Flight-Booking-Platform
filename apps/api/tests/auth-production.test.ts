import { describe, it, expect, beforeEach } from 'vitest';
import { app } from '../src/index';
import { getRepository } from '../src/repositories';
import { authService } from '../src/modules/auth/service';

describe('Production Authentication & JWT Verification', () => {
  beforeEach(async () => {
    await getRepository().clear();
  });

  describe('User Registration (POST /api/v1/auth/register)', () => {
    it('registers a new customer successfully', async () => {
      const res = await app.request('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'sarah.connor@example.com',
          password: 'Password123!',
          fullName: 'Sarah Connor',
          role: 'CUSTOMER'
        })
      });

      expect(res.status).toBe(201);
      const body = (await res.json()) as any;
      expect(body.success).toBe(true);
      expect(body.data.user.email).toBe('sarah.connor@example.com');
      expect(body.data.user.role).toBe('CUSTOMER');
      expect(body.data.user.passwordHash).toBeUndefined(); // Never expose password hash
      expect(body.data.tokens.accessToken).toBeDefined();
      expect(body.data.tokens.refreshToken).toBeDefined();
    });

    it('registers an agency owner and automatically creates agency profile', async () => {
      const res = await app.request('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'owner@skytravels.com',
          password: 'Password123!',
          fullName: 'John Sky',
          role: 'AGENCY_OWNER',
          agencyName: 'Sky Travels International'
        })
      });

      expect(res.status).toBe(201);
      const body = (await res.json()) as any;
      expect(body.success).toBe(true);
      expect(body.data.user.role).toBe('AGENCY_OWNER');
      expect(body.data.tokens.accessToken).toBeDefined();
    });

    it('rejects registration with already registered email with 409 Conflict', async () => {
      await app.request('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'duplicate@example.com',
          password: 'Password123!',
          fullName: 'First User',
          role: 'CUSTOMER'
        })
      });

      const res = await app.request('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'duplicate@example.com',
          password: 'DifferentPassword123!',
          fullName: 'Second User',
          role: 'CUSTOMER'
        })
      });

      expect(res.status).toBe(409);
      const body = (await res.json()) as any;
      expect(body.error.code).toBe('EMAIL_ALREADY_EXISTS');
    });

    it('rejects weak passwords or invalid email with 400 Bad Request', async () => {
      const res = await app.request('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'not-an-email',
          password: 'short',
          fullName: 'Bad User',
          role: 'CUSTOMER'
        })
      });

      expect(res.status).toBe(400);
    });
  });

  describe('User Login (POST /api/v1/auth/login)', () => {
    beforeEach(async () => {
      await authService.register({
        email: 'login.test@example.com',
        password: 'SecurePassword123!',
        fullName: 'Login Test User',
        role: 'CUSTOMER'
      });
    });

    it('logs in successfully with valid credentials returning signed JWT', async () => {
      const res = await app.request('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'login.test@example.com',
          password: 'SecurePassword123!'
        })
      });

      expect(res.status).toBe(200);
      const body = (await res.json()) as any;
      expect(body.success).toBe(true);
      expect(body.data.tokens.accessToken).toBeDefined();
      expect(body.data.user.email).toBe('login.test@example.com');
    });

    it('rejects login with incorrect password with 401 Unauthorized', async () => {
      const res = await app.request('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'login.test@example.com',
          password: 'WrongPassword999!'
        })
      });

      expect(res.status).toBe(401);
      const body = (await res.json()) as any;
      expect(body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('rejects login for non-existent email with 401 Unauthorized', async () => {
      const res = await app.request('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'doesnotexist@example.com',
          password: 'AnyPassword123!'
        })
      });

      expect(res.status).toBe(401);
    });
  });

  describe('Session Verification & JWT Claims (GET /api/v1/auth/me)', () => {
    it('authenticates user using signed Bearer token', async () => {
      const auth = await authService.register({
        email: 'me.test@example.com',
        password: 'Password123!',
        fullName: 'Me Test User',
        role: 'CUSTOMER'
      });

      const res = await app.request('/api/v1/auth/me', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${auth.tokens.accessToken}`
        }
      });

      expect(res.status).toBe(200);
      const body = (await res.json()) as any;
      expect(body.data.email).toBe('me.test@example.com');
      expect(body.data.role).toBe('CUSTOMER');
    });

    it('rejects forged or tampered JWT token with 401 Unauthorized', async () => {
      // Create a tampered token by altering payload
      const auth = await authService.register({
        email: 'tamper@example.com',
        password: 'Password123!',
        fullName: 'Tamper User',
        role: 'CUSTOMER'
      });

      const parts = auth.tokens.accessToken.split('.');
      // Tamper payload to escalate role to ADMIN
      const fakePayload = btoa(JSON.stringify({ sub: auth.user.id, role: 'ADMIN', email: 'tamper@example.com' }));
      const tamperedToken = `${parts[0]}.${fakePayload}.${parts[2]}`;

      const res = await app.request('/api/v1/auth/me', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${tamperedToken}`
        }
      });

      expect(res.status).toBe(401);
    });
  });
});
