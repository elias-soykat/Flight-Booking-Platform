import { describe, it, expect } from 'vitest';
import { app } from '../src/index';

describe('Flight Search & Offer Detail Routes', () => {
  it('GET /api/v1/flights/airports returns available reference airports', async () => {
    const res = await app.request('/api/v1/flights/airports');
    expect(res.status).toBe(200);

    const body = await res.json() as { success: boolean; data: Array<{ iataCode: string; name: string }> };
    expect(body.success).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
    expect(body.data.some(a => a.iataCode === 'JFK')).toBe(true);
  });

  it('GET /api/v1/flights/search returns deterministic offers for valid criteria', async () => {
    const res = await app.request('/api/v1/flights/search?origin=JFK&destination=LHR&departureDate=2026-12-01&passengerCount=1&cabinClass=ECONOMY');
    expect(res.status).toBe(200);

    const body = await res.json() as { success: boolean; count: number; data: Array<{ id: string; baseFare: number; totalAmount: number }> };
    expect(body.success).toBe(true);
    expect(body.count).toBeGreaterThan(0);
    expect(body.data[0]?.totalAmount).toBeGreaterThan(body.data[0]!.baseFare);
  });

  it('GET /api/v1/flights/search rejects invalid search with same origin and destination', async () => {
    const res = await app.request('/api/v1/flights/search?origin=JFK&destination=JFK&departureDate=2026-12-01&passengerCount=1');
    expect(res.status).toBe(400);

    const body = await res.json() as { success: boolean; error: { code: string } };
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('GET /api/v1/flights/:offerId retrieves flight offer details', async () => {
    // 1. Search to get an offerId
    const searchRes = await app.request('/api/v1/flights/search?origin=LHR&destination=DXB&departureDate=2026-12-10&passengerCount=1&cabinClass=BUSINESS');
    const searchBody = await searchRes.json() as { data: Array<{ id: string }> };
    const offerId = searchBody.data[0]!.id;

    // 2. Lookup by offerId
    const detailRes = await app.request(`/api/v1/flights/${offerId}`);
    expect(detailRes.status).toBe(200);

    const detailBody = await detailRes.json() as { success: boolean; data: { id: string; cabinClass: string } };
    expect(detailBody.success).toBe(true);
    expect(detailBody.data.id).toBe(offerId);
    expect(detailBody.data.cabinClass).toBe('BUSINESS');
  });
});
