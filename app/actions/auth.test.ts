import { describe, it, expect, vi, beforeEach } from 'vitest';
import { signIn, signUp, resetPassword } from './auth';
import { redirect } from 'next/navigation';

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
    redirect: vi.fn(),
}));

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
}));

// Mock Supabase
const mockSignInWithPassword = vi.fn();
const mockSignUp = vi.fn();
const mockResetPasswordForEmail = vi.fn();
vi.mock('@/lib/supabase/server', () => ({
    createClient: vi.fn(() => Promise.resolve({
        auth: {
            signInWithPassword: mockSignInWithPassword,
            signUp: mockSignUp,
            resetPasswordForEmail: mockResetPasswordForEmail,
        },
    })),
}));

describe('Auth Actions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('signIn', () => {
        it('should validate invalid email', async () => {
            const formData = new FormData();
            formData.append('email', 'invalid-email');
            formData.append('password', 'password123');

            const result = await signIn(formData);
            expect(result).toEqual({ success: false, error: 'Invalid email address' });
        });

        it('should redirect on success', async () => {
            mockSignInWithPassword.mockResolvedValue({ data: {}, error: null });

            const formData = new FormData();
            formData.append('email', 'test@example.com');
            formData.append('password', 'password123');

            try {
                await signIn(formData);
            } catch (e) {
                // next.js redirect throws, we catch it or ignore if mocked correctly
            }

            expect(redirect).toHaveBeenCalledWith('/dashboard');
        });
    });

    describe('signUp', () => {
        it('should validate short password', async () => {
            const formData = new FormData();
            formData.append('email', 'test@example.com');
            formData.append('password', '123');
            formData.append('full_name', 'Test User');

            const result = await signUp(formData);
            expect(result).toEqual({ success: false, error: 'Password must be at least 6 characters' });
        });
    });

    describe('resetPassword', () => {
        it('should include correct redirectTo URL', async () => {
            mockResetPasswordForEmail.mockResolvedValue({ data: {}, error: null });

            const formData = new FormData();
            formData.append('email', 'test@example.com');

            await resetPassword(formData);

            expect(mockResetPasswordForEmail).toHaveBeenCalledWith('test@example.com', {
                redirectTo: expect.stringContaining('auth/callback?next=/reset-password'),
            });
        });
    });
});
