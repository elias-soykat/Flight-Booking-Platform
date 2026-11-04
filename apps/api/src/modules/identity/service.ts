import type { UserRole } from '@travel-platform/shared';
import { getRepository } from '../../repositories';
import type { UserEntity } from '../../repositories/types';

export type { UserEntity };

export interface CustomerProfileEntity {
  id: string;
  userId: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
}

const mockProfiles = new Map<string, CustomerProfileEntity>();

export const identityService = {
  async getOrCreateUser(userId: string, role: UserRole = 'CUSTOMER', email?: string): Promise<UserEntity> {
    const repo = getRepository();
    let user = await repo.users.getUserById(userId);
    if (!user) {
      user = await repo.users.createUser({
        id: userId,
        email: email || `${userId}@example.com`,
        role,
        status: 'ACTIVE'
      });
    }
    return user;
  },

  async getUser(userId: string): Promise<UserEntity | null> {
    return await getRepository().users.getUserById(userId);
  },

  async getUserByEmail(email: string): Promise<UserEntity | null> {
    return await getRepository().users.getUserByEmail(email);
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
    return [];
  },

  async clearStore(): Promise<void> {
    mockProfiles.clear();
    await getRepository().clear();
  }
};
