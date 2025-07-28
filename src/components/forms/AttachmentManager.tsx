import {useCallback, useEffect, useRef, useState} from "react";
import {useAttachmentDelete, useAttachmentUpload} from "@/hooks/api/useComplaints";

export const useAttachmentManager = () => {
    const [attachments, setAttachments] = useState<any[]>([]);
    const uploadMutation = useAttachmentUpload();

    // Use ref to track current attachments without closures
    const attachmentsRef = useRef(attachments);
    attachmentsRef.current = attachments;

    const addFiles = useCallback(async (newFiles: File[]) => {
        // Generate all new attachments first
        const newAttachments = newFiles.map(file => ({
            id: crypto.randomUUID(),
            file,
            preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
            status: 'uploading' as const,
        }));

        // Update state immediately
        setAttachments(prev => [...prev, ...newAttachments]);

        await setTimeout(() => '', 2000);

        // Process each upload with proper attachment reference
        newAttachments.forEach((newAttachment:any) => {
              uploadMutation.mutate(newAttachment.file, {
                onSuccess: (data) => {
                    setAttachments(current =>
                        current.map(a => {
                            return (
                                a.id === newAttachment.id
                                    ? {...a, status: 'success', path: data.path}
                                    : a)
                            }
                        )
                    );
                },
                onError: (error) => {
                    setAttachments(current =>
                        current.map(a =>
                            a.id === newAttachment.id
                                ? {
                                    ...a,
                                    status: 'error',
                                    error: error instanceof Error ? error.message : 'Upload failed'
                                }
                                : a
                        )
                    );
                }
            });
        });
    }, [uploadMutation]);
    const {mutate :deleteAttachment} = useAttachmentDelete();
    const removeFile = useCallback((id: string) => {
        setAttachments((prev:any) => {
            const removed = prev.find((a:any) => a.id === id);
            if (removed?.path) {
                // Call delete API if file was successfully uploaded
                deleteAttachment(removed.path);
            }
            if (removed?.preview) {
                URL.revokeObjectURL(removed.preview);
            }
            return prev.filter((a:any) => a.id !== id);
        });
    }, []);

    // Clean up object URLs on unmount
    useEffect(() => {
        return () => {
            attachmentsRef.current.forEach(a => {
                if (a.preview) URL.revokeObjectURL(a.preview);
            });
        };
    }, []);

    return {
        attachments,
        addFiles,
        removeFile,
        // Helper to get only successful attachments
        getSuccessfulAttachments: useCallback(() => (
            attachments.filter((a:any) => a.status === 'success' && a.path)
        ), [])
    };
};