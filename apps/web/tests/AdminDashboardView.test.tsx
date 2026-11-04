import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CancellationReviewQueue } from '../src/components/CancellationReviewQueue';
import { AuditLogView } from '../src/components/AuditLogView';
import type { CancellationRequestEntity, AuditLogEntity } from '@travel-platform/shared';

const mockCancellations: CancellationRequestEntity[] = [
  {
    id: 'req-1',
    bookingId: 'book-1',
    bookingReference: 'BK-ABC123',
    requestedByUserId: 'cust-1',
    reason: 'Medical emergency before flight',
    status: 'PENDING',
    previousBookingStatus: 'TICKETED',
    createdAt: '2026-11-04T10:00:00Z',
    updatedAt: '2026-11-04T10:00:00Z'
  }
];

const mockAuditLogs: AuditLogEntity[] = [
  {
    id: 'log-1',
    actorUserId: 'admin-1',
    action: 'CANCELLATION_APPROVED',
    entityType: 'BOOKING',
    entityId: 'book-1',
    metadata: { reviewNote: 'Approved simulated refund' },
    createdAt: '2026-11-04T10:15:00Z'
  },
  {
    id: 'log-2',
    actorUserId: 'cust-1',
    action: 'CANCELLATION_REQUESTED',
    entityType: 'BOOKING',
    entityId: 'book-1',
    createdAt: '2026-11-04T10:00:00Z'
  }
];

describe('Admin Dashboard Components', () => {
  describe('CancellationReviewQueue Component', () => {
    it('renders pending cancellation requests with details and actions', () => {
      render(
        <CancellationReviewQueue
          cancellations={mockCancellations}
          onReview={vi.fn()}
        />
      );

      expect(screen.getByText('BK-ABC123')).toBeInTheDocument();
      expect(screen.getByText(/Medical emergency before flight/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Approve/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Reject/i })).toBeInTheDocument();
    });

    it('handles approve action with optional note', async () => {
      const handleReview = vi.fn().mockResolvedValue(undefined);
      render(
        <CancellationReviewQueue
          cancellations={mockCancellations}
          onReview={handleReview}
        />
      );

      const approveBtn = screen.getByRole('button', { name: /Approve/i });
      fireEvent.click(approveBtn);

      await waitFor(() => {
        expect(handleReview).toHaveBeenCalledWith('req-1', 'APPROVE', expect.any(String));
      });
    });

    it('renders empty message when no pending cancellations', () => {
      render(
        <CancellationReviewQueue
          cancellations={[]}
          onReview={vi.fn()}
        />
      );

      expect(screen.getByText(/No pending cancellation requests/i)).toBeInTheDocument();
    });
  });

  describe('AuditLogView Component', () => {
    it('renders audit log entries with action, actor, and entity', () => {
      render(<AuditLogView logs={mockAuditLogs} />);

      expect(screen.getByText('CANCELLATION_APPROVED')).toBeInTheDocument();
      expect(screen.getByText('CANCELLATION_REQUESTED')).toBeInTheDocument();
      expect(screen.getByText('admin-1')).toBeInTheDocument();
    });

    it('renders empty message when no audit logs exist', () => {
      render(<AuditLogView logs={[]} />);
      expect(screen.getByText(/No audit log entries recorded/i)).toBeInTheDocument();
    });
  });
});
