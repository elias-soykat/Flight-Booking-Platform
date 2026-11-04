import type { UserRole } from '@travel-platform/shared';

export interface UserEntity {
  id: string;
  email: string;
  role: UserRole;
  status: 'ACTIVE' | 'SUSPENDED';
  createdAt: string;
  updatedAt: string;
}

export interface CustomerProfileEntity {
  id: string;
  userId: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
}

// In-memory identity registry for standalone tests and $0 local execution
const mockUsers = new Map<string, UserEntity>();
const mockProfiles = new Map<string, CustomerProfileEntity>();

export const identityService = {
  async getOrCreateUser(userId: string, role: UserRole = 'CUSTOMER', email?: string): Promise<UserEntity> {
    let user = mockUsers.get(userId);
    if (!user) {
      user = {
        id: userId,
        email: email || `${userId}@example.com`,
        role,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      mockUsers.set(userId, user);
    }
    return user;
  },

  async getUser(userId: string): Promise<UserEntity | null> {
    return mockUsers.get(userId) || null;
  },

  async getCustomerProfile(userId: string): Promise<CustomerProfileEntity> {
    let profile = mockProfiles.get(userId);
    if (!profile) {
      profile = {
        id: `prof-${userId}`,
        userId,
        firstName: '',
        lastName: '',
        phone: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      mockProfiles.set(userId, profile);
    }
    return profile;
  },

  async updateCustomerProfile(
    userId: string,
    updates: { firstName?: string; lastName?: string; phone?: string }
  ): Promise<CustomerProfileEntity> {
    const profile = await this.getCustomerProfile(userId);
    if (updates.firstName !== undefined) profile.firstName = updates.firstName;
    if (updates.lastName !== undefined) profile.lastName = updates.lastName;
    if (updates.phone !== undefined) profile.phone = updates.phone;
    profile.updatedAt = new Date().toISOString();
    mockProfiles.set(userId, profile);
    return profile;
  },

  async listAllUsers(): Promise<UserEntity[]> {
    return Array.from(mockUsers.values());
  }
};
