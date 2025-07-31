import {useCallback, useEffect, useRef, useState} from "react";
import {useAttachmentDelete, useAttachmentUpload} from "@/hooks/api/useComplaints";

export const useAttachmentManager = () => {
    const [attachments, setAttachments] = useState<any[]>([]);
    const { mutateAsync: uploadFile }  = useAttachmentUpload();

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
        // Process each upload with its own mutation
        await Promise.all(newAttachments.map(async (attachment) => {
            // Check if the file is already uploaded
            try {
                const result = await uploadFile(attachment.file);
                setAttachments(current => current.map(a => {
                        return (a.id === attachment.id
                            ? {...a, status: 'success', path: result.path}
                            : a)
                    }
                ));
            } catch (error) {
                setAttachments(current => current.map(a =>
                    a.id === attachment.id
                        ? {
                            ...a,
                            status: 'error',
                            error: error instanceof Error ? error.message : 'Upload failed'
                        }
                        : a
                ));
            }
        }));
    }, [uploadFile]);
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
        setAttachments,
        // Helper to get only successful attachments
        getSuccessfulAttachments: useCallback(() => (
            attachments.filter((a:any) => a.status === 'success' && a.path)
        ), [])
    };
};