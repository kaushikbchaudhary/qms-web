'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSiteConfig, useUpdateSiteConfig } from '@/hooks/api/useSiteConfig';
import { LoginMode } from '@/lib/api/types/siteConfig';

const SiteSettingsPage = () => {
    const { data: siteConfig, isLoading, isRefetching } = useSiteConfig();
    const updateConfig = useUpdateSiteConfig();

    const currentMode: LoginMode = siteConfig?.loginMode ?? 'OTP';
    const isUpdating = updateConfig.isPending;

    return (
        <div className="container max-w-3xl py-10">
            <Card>
                <CardHeader>
                    <CardTitle>Site Authentication Settings</CardTitle>
                    <CardDescription>
                        Choose how users authenticate. Switching to password authentication enables email and password login across the application.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label>Login Method</Label>
                        <Select
                            value={currentMode}
                            onValueChange={(value) => updateConfig.mutate({ loginMode: value as LoginMode })}
                            disabled={isLoading || isUpdating || isRefetching}
                        >
                            <SelectTrigger className="w-full sm:w-64">
                                <SelectValue placeholder="Select login method" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="OTP">Email + OTP (current flow)</SelectItem>
                                <SelectItem value="PASSWORD">Email + Password</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <Alert>
                        <AlertDescription>
                            Users created by the super admin start with the default password <span className="font-semibold tracking-widest">000000</span>.
                            Encourage them to update it from their profile after signing in.
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>
        </div>
    );
};

export default SiteSettingsPage;
