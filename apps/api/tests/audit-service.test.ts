import { describe, it, expect } from 'vitest';
import { auditService } from '../src/modules/audit/service';
import { CreateCancellationRequestSchema, ReviewCancellationRequestSchema } from '@travel-platform/shared';

describe('Audit Logging Service & Cancellation Schemas', () => {
  it('validates CreateCancellationRequestSchema', () => {
    const valid = CreateCancellationRequestSchema.parse({
      reason: 'Travel plans changed due to emergency'
    });
    expect(valid.reason).toContain('emergency');

    expect(() =>
      CreateCancellationRequestSchema.parse({
        reason: 'no'
      })
    ).toThrow();
  });

  it('validates ReviewCancellationRequestSchema', () => {
    const approved = ReviewCancellationRequestSchema.parse({
      decision: 'APPROVE',
      reviewNote: 'Approved simulated refund'
    });
    expect(approved.decision).toBe('APPROVE');

    const rejected = ReviewCancellationRequestSchema.parse({
      decision: 'REJECT',
      reviewNote: 'Non-refundable fare class'
    });
    expect(rejected.decision).toBe('REJECT');

    expect(() =>
      ReviewCancellationRequestSchema.parse({
        decision: 'INVALID_DECISION',
        reviewNote: 'Note'
      })
    ).toThrow();
  });

  it('records audit log entries and retrieves ordered audit trail', async () => {
    const entry = await auditService.logAction({
      actorUserId: 'admin-1',
      action: 'MANUAL_TICKET_ISSUANCE',
      entityType: 'BOOKING',
      entityId: 'book-100',
      metadata: { ticketNumber: '001-DEMO-1234567890' }
    });

    expect(entry.id).toBeDefined();
    expect(entry.action).toBe('MANUAL_TICKET_ISSUANCE');
    expect(entry.createdAt).toBeDefined();

    const logs = await auditService.listLogs(10);
    expect(logs.some(l => l.id === entry.id)).toBe(true);
  });
});

