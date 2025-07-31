'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { useRouter } from 'next/navigation';

interface DeleteConfirmDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title?: string;
    description?: string;
    onConfirm?: () => Promise<void>;
    redirectAfterDelete?: string;
}

export function DeleteConfirmDialog({
                                        open,
                                        onOpenChange,
                                        title = 'Are you sure?',
                                        description = 'This action cannot be undone. This will permanently delete the item.',
                                        onConfirm,
                                        redirectAfterDelete,
                                    }: DeleteConfirmDialogProps) {
    const [isDeleting, setIsDeleting] = useState(false);
    const router = useRouter();

    const handleDelete = async () => {
        try {
            setIsDeleting(true);
            if (onConfirm) {
                await onConfirm();
            }
            if (redirectAfterDelete) {
                router.push(redirectAfterDelete);
            }
        } catch (error) {
        } finally {
            setIsDeleting(false);
            onOpenChange(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isDeleting}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={isDeleting}
                    >
                        {isDeleting ? 'Deleting...' : 'Delete'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}