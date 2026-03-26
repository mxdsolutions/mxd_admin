import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
import { createAdminClient, createClient } from '@/lib/supabase/server';

// Mock Supabase
vi.mock('@/lib/supabase/server', () => ({
    createClient: vi.fn(),
    createAdminClient: vi.fn(),
}));

describe('Users API route', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return 401 if user is not authenticated', async () => {
        (createClient as any).mockResolvedValue({
            auth: {
                getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
            },
        });

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.error).toBe('Unauthorized');
    });

    it('should return 403 if user is not an admin', async () => {
        (createClient as any).mockResolvedValue({
            auth: {
                getUser: vi.fn().mockResolvedValue({ 
                    data: { user: { id: 'user-123', email: 'test@example.com' } }, 
                    error: null 
                }),
            },
            from: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: { role: 'homeowner' }, error: null }),
        });

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(403);
        expect(data.error).toBe('Forbidden: Admin access required');
    });

    it('should return 200 and users list if user is an admin', async () => {
        const mockUsers = [{ id: '1', email: 'u1@e.com' }];
        
        // Mock regular client for auth check
        (createClient as any).mockResolvedValue({
            auth: {
                getUser: vi.fn().mockResolvedValue({ 
                    data: { user: { id: 'admin-123', email: 'admin@example.com' } }, 
                    error: null 
                }),
            },
            from: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: { role: 'admin' }, error: null }),
        });

        // Mock admin client for listing users
        (createAdminClient as any).mockResolvedValue({
            auth: {
                admin: {
                    listUsers: vi.fn().mockResolvedValue({ data: { users: mockUsers }, error: null }),
                }
            }
        });

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.users).toEqual(mockUsers);
    });
});
