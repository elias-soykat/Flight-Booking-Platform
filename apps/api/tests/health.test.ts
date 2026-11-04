import { describe, it, expect } from 'vitest';
import { app } from '../src/index';

describe('API Health and Base Routes', () => {
  it('GET /health returns 200 with healthy status', async () => {
    const res = await app.request('/health');
    expect(res.status).toBe(200);

    const data = await res.json() as { status: string; environment: string };
    expect(data.status).toBe('healthy');
    expect(data.environment).toBeDefined();
  });

  it('GET /api/v1/info returns metadata with demoNotice', async () => {
    const res = await app.request('/api/v1/info');
    expect(res.status).toBe(200);

    const data = await res.json() as { name: string; mode: string; demoNotice: string };
    expect(data.name).toBe('Travel Booking Platform API');
    expect(data.mode).toBe('MVP_MOCK');
    expect(data.demoNotice).toContain('DEMO / MOCK');
  });

  it('GET /non-existent returns structured 404', async () => {
    const res = await app.request('/non-existent');
    expect(res.status).toBe(404);

    const data = await res.json() as { success: boolean; error: { code: string } };
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('NOT_FOUND');
  });
});
