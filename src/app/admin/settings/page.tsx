'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSiteConfig, useUpdateSiteConfig } from '@/hooks/api/useSiteConfig';
import { LoginMode } from '@/lib/api/types/siteConfig';
import { COMPLAINT_SUBMISSION_FIELDS, DEFAULT_COMPLAINT_SUBMISSION_REQUIREMENTS } from '@/config/formRequirements';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const SiteSettingsPage = () => {
    const { data: siteConfig, isLoading, isRefetching } = useSiteConfig();
    const updateConfig = useUpdateSiteConfig();

    const currentMode: LoginMode = siteConfig?.loginMode ?? 'OTP';
    const isUpdating = updateConfig.isPending;
    const requirementMap = siteConfig?.complaintSubmissionRequirements ?? DEFAULT_COMPLAINT_SUBMISSION_REQUIREMENTS;

    const handleToggle = (fieldPath: string, currentRequired: boolean) => {
        updateConfig.mutate({
            complaintSubmissionRequirements: {
                [fieldPath]: !currentRequired,
            },
        });
    };

    return (
        <div className="container max-w-4xl py-10 space-y-8">
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

            <Card>
                <CardHeader>
                    <CardTitle>Complaint Submission Form</CardTitle>
                    <CardDescription>
                        Control which fields are mandatory when users create a new complaint.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {COMPLAINT_SUBMISSION_FIELDS.map((field) => {
                        const isRequired = requirementMap[field.path] ?? field.defaultRequired;
                        const isDefault = field.defaultRequired === isRequired;
                        return (
                            <div
                                key={field.path}
                                className={cn(
                                    'flex items-start justify-between gap-4 rounded-md border border-border/60 p-4 transition-colors',
                                    isRequired ? 'bg-muted/50' : 'bg-background'
                                )}
                            >
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <p className="font-medium leading-none">{field.label}</p>
                                        <Badge variant={isDefault ? 'outline' : 'secondary'}>
                                            {isRequired ? 'Required' : 'Optional'}
                                        </Badge>
                                    </div>
                                    {field.description && (
                                        <p className="text-sm text-muted-foreground">{field.description}</p>
                                    )}
                                </div>
                                <Switch
                                    checked={isRequired}
                                    onCheckedChange={() => handleToggle(field.path, isRequired)}
                                    disabled={isLoading || isUpdating || isRefetching}
                                    aria-label={`Toggle requirement for ${field.label}`}
                                />
                            </div>
                        );
                    })}
                </CardContent>
            </Card>
        </div>
    );
};

export default SiteSettingsPage;
