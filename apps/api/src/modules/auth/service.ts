import type { UserRole } from '@travel-platform/shared';
import { getRepository } from '../../repositories';
import type { UserEntity } from '../../repositories/types';

export class AuthError extends Error {
  code: string;
  statusCode: number;

  constructor(code: string, message: string, statusCode: number = 400) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
}

export interface RegisterParams {
  email: string;
  password: string;
  fullName: string;
  role?: UserRole;
  agencyName?: string;
}

export interface LoginParams {
  email: string;
  password: string;
}

export interface TokenClaims {
  sub: string;
  email: string;
  role: UserRole;
  agencyId?: string;
  iat: number;
  exp: number;
}

const JWT_SECRET = 'antigravity-secure-commercial-jwt-secret-key-2026';
const ACCESS_TOKEN_EXPIRY = 3600; // 1 hour in seconds
const REFRESH_TOKEN_EXPIRY = 7 * 86400; // 7 days

// Helper to base64url encode
function base64UrlEncode(str: string): string {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return atob(base64);
}

// Web Crypto HMAC-SHA256 signature
async function signJwt(payload: Record<string, any>, secret: string): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const dataToSign = `${encodedHeader}.${encodedPayload}`;

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, enc.encode(dataToSign));
  const binary = String.fromCharCode(...new Uint8Array(signature));
  const encodedSignature = base64UrlEncode(binary);

  return `${dataToSign}.${encodedSignature}`;
}

async function verifyJwt(token: string, secret: string): Promise<TokenClaims | null> {
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const dataToSign = `${encodedHeader}.${encodedPayload}`;

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );

  const rawSig = base64UrlDecode(encodedSignature);
  const sigBytes = new Uint8Array(rawSig.length);
  for (let i = 0; i < rawSig.length; i++) {
    sigBytes[i] = rawSig.charCodeAt(i);
  }

  const isValid = await crypto.subtle.verify('HMAC', key, sigBytes, enc.encode(dataToSign));
  if (!isValid) return null;

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as TokenClaims;
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return null; // Expired
    }
    return payload;
  } catch {
    return null;
  }
}

// Password hashing using PBKDF2 with SHA-256
async function hashPassword(password: string): Promise<string> {
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    256
  );

  const saltHex = Array.from(salt).map((b) => b.toString(16).padStart(2, '0')).join('');
  const hashHex = Array.from(new Uint8Array(derivedBits)).map((b) => b.toString(16).padStart(2, '0')).join('');
  return `${saltHex}:${hashHex}`;
}

async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [saltHex, expectedHashHex] = storedHash.split(':');
  if (!saltHex || !expectedHashHex) return false;

  const salt = new Uint8Array(saltHex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)));
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    256
  );

  const actualHashHex = Array.from(new Uint8Array(derivedBits)).map((b) => b.toString(16).padStart(2, '0')).join('');
  return actualHashHex === expectedHashHex;
}

export const authService = {
  async register(params: RegisterParams): Promise<{ user: Omit<UserEntity, 'passwordHash'>; tokens: AuthTokens }> {
    const { email, password, fullName, role = 'CUSTOMER', agencyName } = params;
    const normalizedEmail = email.toLowerCase().trim();
    const repo = getRepository();

    const existing = await repo.users.getUserByEmail(normalizedEmail);
    if (existing) {
      throw new AuthError('EMAIL_ALREADY_EXISTS', 'A user with this email address is already registered', 409);
    }

    const passwordHash = await hashPassword(password);
    const userId = `usr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const user = await repo.users.createUser({
      id: userId,
      email: normalizedEmail,
      fullName,
      role,
      status: 'ACTIVE',
      passwordHash
    });

    let agencyId: string | undefined = undefined;
    if (role === 'AGENCY_OWNER') {
      const agency = await repo.agencies.createAgency({
        id: `agency-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        name: agencyName || `${fullName}'s Travel Agency`,
        ownerUserId: user.id,
        status: 'ACTIVE'
      });
      agencyId = agency.id;
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role, agencyId);

    const { passwordHash: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, tokens };
  },

  async login(params: LoginParams): Promise<{ user: Omit<UserEntity, 'passwordHash'>; tokens: AuthTokens }> {
    const { email, password } = params;
    const normalizedEmail = email.toLowerCase().trim();
    const repo = getRepository();

    const user = await repo.users.getUserByEmail(normalizedEmail);
    if (!user || !user.passwordHash) {
      throw new AuthError('INVALID_CREDENTIALS', 'Invalid email or password', 401);
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      throw new AuthError('INVALID_CREDENTIALS', 'Invalid email or password', 401);
    }

    let agencyId: string | undefined = undefined;
    if (user.role === 'AGENCY_OWNER') {
      const agency = await repo.agencies.getAgencyByOwner(user.id);
      agencyId = agency?.id;
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role, agencyId);

    const { passwordHash: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, tokens };
  },

  async generateTokens(userId: string, email: string, role: UserRole, agencyId?: string): Promise<AuthTokens> {
    const now = Math.floor(Date.now() / 1000);
    const accessPayload: TokenClaims = {
      sub: userId,
      email,
      role,
      agencyId,
      iat: now,
      exp: now + ACCESS_TOKEN_EXPIRY
    };

    const refreshPayload = {
      sub: userId,
      type: 'refresh',
      iat: now,
      exp: now + REFRESH_TOKEN_EXPIRY
    };

    const accessToken = await signJwt(accessPayload, JWT_SECRET);
    const refreshToken = await signJwt(refreshPayload, JWT_SECRET);

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: ACCESS_TOKEN_EXPIRY
    };
  },

  async verifyToken(token: string): Promise<TokenClaims | null> {
    return await verifyJwt(token, JWT_SECRET);
  }
};

