import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import './setup';
import { AgencyPortal } from '../src/components/AgencyPortal';
import { CustomerInvitations } from '../src/components/CustomerInvitations';

describe('Agency Portal & Customer Invitations UI', () => {
  it('renders agency invitation form with email input and invite button', () => {
    const handleInvite = vi.fn();
    render(
      <AgencyPortal
        agency={{ id: 'agency-1', name: 'Global Travels', ownerUserId: 'user-1' }}
        invitations={[]}
        associatedCustomers={[]}
        onInvite={handleInvite}
      />
    );

    expect(screen.getByText('Global Travels')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('customer@example.com')).toBeInTheDocument();

    const inviteBtn = screen.getByRole('button', { name: /send invitation/i });
    expect(inviteBtn).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('customer@example.com'), {
      target: { value: 'traveler@test.com' }
    });
    fireEvent.click(inviteBtn);
    expect(handleInvite).toHaveBeenCalledWith('traveler@test.com');
  });

  it('renders customer invitations with accept/reject buttons and one-agency notice', () => {
    const handleAccept = vi.fn();
    const handleReject = vi.fn();

    const mockInvitations = [
      {
        id: 'inv-1',
        agencyId: 'agency-1',
        agencyName: 'Global Travels',
        email: 'traveler@test.com',
        status: 'PENDING' as const,
        expiresAt: '2026-11-15T00:00:00Z',
        createdAt: '2026-11-04T00:00:00Z'
      }
    ];

    render(
      <CustomerInvitations
        invitations={mockInvitations}
        activeMembership={null}
        onAccept={handleAccept}
        onReject={handleReject}
      />
    );

    expect(screen.getByText('Global Travels')).toBeInTheDocument();
    expect(screen.getByText(/You can be associated with no more than one agency at a time/i)).toBeInTheDocument();

    const acceptBtn = screen.getByRole('button', { name: /accept & join/i });
    const rejectBtn = screen.getByRole('button', { name: /decline/i });

    expect(acceptBtn).toBeInTheDocument();
    expect(rejectBtn).toBeInTheDocument();

    fireEvent.click(acceptBtn);
    expect(handleAccept).toHaveBeenCalledWith('inv-1');
  });
});
