'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/authStore';
import { useUpdatePassword } from '@/hooks/api/useUser';
import { toast } from 'sonner';
import { useSessions, useLogoutAll, useLogoutDevice } from '@/hooks/api/useAuth';
import { formatDistanceToNow } from 'date-fns';
import { Loader2, LogOut, Smartphone } from 'lucide-react';

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

    const { data: sessions, isLoading: sessionsLoading } = useSessions();
    const logoutAll = useLogoutAll();
    const logoutDevice = useLogoutDevice();
    const currentSessionId = useAuthStore.getState().sessionId;

    const handleLogoutDevice = (sessionId?: string) => {
        if (!sessionId) return;
        logoutDevice.mutate(sessionId);
    };

    return (
        <div className="container max-w-5xl py-10 space-y-6">
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

            <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-2">
                    <div>
                        <CardTitle>Active Sessions</CardTitle>
                        <CardDescription>Manage devices currently signed in to your account.</CardDescription>
                    </div>
                    <Button
                        variant="destructive"
                        size="sm"
                        disabled={logoutAll.isPending}
                        onClick={() => logoutAll.mutate()}
                    >
                        {logoutAll.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogOut className="mr-2 h-4 w-4" />}
                        Logout other devices
                    </Button>
                </CardHeader>
                <CardContent>
                    {sessionsLoading ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Loading sessions…
                        </div>
                    ) : !sessions?.length ? (
                        <p className="text-sm text-muted-foreground">No active sessions found.</p>
                    ) : (
                        <div className="space-y-3">
                            {sessions.map((session) => {
                                const isCurrent = session.isCurrent ?? (session.sessionId === currentSessionId);
                                return (
                                    <div
                                        key={session.sessionId}
                                        className="flex flex-col gap-2 rounded-lg border bg-card/50 p-4 md:flex-row md:items-center md:justify-between"
                                    >
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-sm font-medium">
                                                <Smartphone className="h-4 w-4 text-muted-foreground" />
                                                <span>{session.deviceName || 'Unknown device'}</span>
                                                {isCurrent && (
                                                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                                                        Current
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {session.ipAddress ? `IP: ${session.ipAddress}` : 'IP: —'} •{' '}
                                                {session.userAgent || 'User agent unavailable'}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                Last used {session.lastUsedAt ? formatDistanceToNow(new Date(session.lastUsedAt), { addSuffix: true }) : '—'} | Created{' '}
                                                {session.createdAt ? formatDistanceToNow(new Date(session.createdAt), { addSuffix: true }) : '—'}
                                            </div>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={isCurrent || logoutDevice.isPending}
                                            onClick={() => handleLogoutDevice(session.sessionId)}
                                        >
                                            {logoutDevice.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogOut className="mr-2 h-4 w-4" />}
                                            Logout device
                                        </Button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default PasswordSettingsPage;
