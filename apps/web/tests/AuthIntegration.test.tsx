import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import './setup';
import React from 'react';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { AuthModal } from '../src/components/AuthModal';
import { Navbar } from '../src/components/Navbar';
import { DEMO_USERS } from '../src/components/UserSwitcher';

// Mock global fetch for auth tests
const mockFetch = vi.fn();
global.fetch = mockFetch;

const TestNavbarWithAuth = () => {
  const [modalOpen, setModalOpen] = React.useState(false);
  const [currentUser, setCurrentUser] = React.useState(DEMO_USERS.CUSTOMER);

  return (
    <AuthProvider>
      <Navbar
        currentUser={currentUser}
        onUserChange={setCurrentUser}
        onOpenAuth={() => setModalOpen(true)}
      />
      <AuthModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </AuthProvider>
  );
};

describe('Frontend Authentication Integration & Modal UI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders Sign In trigger button in Navbar when unauthenticated', () => {
    render(<TestNavbarWithAuth />);
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('opens AuthModal with Sign In and Create Account tabs', () => {
    render(<TestNavbarWithAuth />);
    const signInBtn = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(signInBtn);

    expect(screen.getByText('Welcome Back')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('allows user to register a new account and shows user in Navbar', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          user: {
            id: 'usr-new-1',
            email: 'newuser@travelhub.com',
            fullName: 'New Traveler',
            role: 'CUSTOMER'
          },
          tokens: {
            accessToken: 'mock-access-token-123',
            refreshToken: 'mock-refresh-token-123'
          }
        }
      })
    });

    render(<TestNavbarWithAuth />);
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    // Switch to Create Account tab
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));
    expect(screen.getByPlaceholderText(/full name/i)).toBeInTheDocument();

    // Fill registration form
    fireEvent.change(screen.getByPlaceholderText(/full name/i), { target: { value: 'New Traveler' } });
    fireEvent.change(screen.getByPlaceholderText(/email address/i), { target: { value: 'newuser@travelhub.com' } });
    fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: 'Password123!' } });

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /register account/i }));

    await waitFor(() => {
      expect(screen.getByText('New Traveler')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument();
    });
  });

  it('allows authenticated user to log out', async () => {
    // Pre-populate localStorage
    localStorage.setItem(
      'travelhub_user',
      JSON.stringify({
        id: 'usr-1',
        email: 'alice@example.com',
        fullName: 'Alice Smith',
        role: 'CUSTOMER'
      })
    );
    localStorage.setItem('travelhub_access_token', 'stored-token');

    render(<TestNavbarWithAuth />);

    expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    const signOutBtn = screen.getByRole('button', { name: /sign out/i });
    fireEvent.click(signOutBtn);

    expect(screen.queryByText('Alice Smith')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });
});
