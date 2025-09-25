'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/authStore';
import { useUpdatePassword } from '@/hooks/api/useUser';
import { toast } from 'sonner';

const PasswordSettingsPage = () => {
    const user = useAuthStore((state) => state.user);
    const [formState, setFormState] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    const updatePassword = useUpdatePassword(user?._id);

    const handleChange = (field: 'currentPassword' | 'newPassword' | 'confirmPassword') =>
        (event: React.ChangeEvent<HTMLInputElement>) => {
            setFormState((prev) => ({ ...prev, [field]: event.target.value }));
        };

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!user?._id) {
            toast.error('You must be signed in to update your password.');
            return;
        }

        if (formState.newPassword.length < 6) {
            toast.error('New password must be at least 6 characters long.');
            return;
        }

        if (formState.newPassword !== formState.confirmPassword) {
            toast.error('New password and confirmation do not match.');
            return;
        }

        updatePassword.mutate(
            {
                currentPassword: formState.currentPassword,
                newPassword: formState.newPassword,
            },
            {
                onSuccess: () => {
                    setFormState({ currentPassword: '', newPassword: '', confirmPassword: '' });
                },
            }
        );
    };

    return (
        <div className="container max-w-xl py-10">
            <Card>
                <CardHeader>
                    <CardTitle>Change Password</CardTitle>
                    <CardDescription>
                        Update your account password. Default password for new users is{' '}
                        <span className="font-semibold tracking-widest">000000</span>.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="current-password">Current Password</Label>
                            <Input
                                id="current-password"
                                type="password"
                                value={formState.currentPassword}
                                onChange={handleChange('currentPassword')}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="new-password">New Password</Label>
                            <Input
                                id="new-password"
                                type="password"
                                value={formState.newPassword}
                                onChange={handleChange('newPassword')}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirm-password">Confirm New Password</Label>
                            <Input
                                id="confirm-password"
                                type="password"
                                value={formState.confirmPassword}
                                onChange={handleChange('confirmPassword')}
                                required
                            />
                        </div>
                        <Button type="submit" className="w-full" disabled={updatePassword.isPending}>
                            {updatePassword.isPending ? 'Updating...' : 'Update Password'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default PasswordSettingsPage;
