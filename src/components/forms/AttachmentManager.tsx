import {useCallback, useEffect, useRef, useState} from "react";
import {useAttachmentDelete, useAttachmentUpload} from "@/hooks/api/useComplaints";

const createAttachmentId = (): string => {
    if (typeof crypto !== 'undefined') {
        if (typeof crypto.randomUUID === 'function') {
            return crypto.randomUUID();
        }

        if (typeof crypto.getRandomValues === 'function') {
            const buffer = new Uint8Array(16);
            crypto.getRandomValues(buffer);

            // RFC 4122 version 4 UUID algorithm
            buffer[6] = (buffer[6] & 0x0f) | 0x40;
            buffer[8] = (buffer[8] & 0x3f) | 0x80;

            const byteToHex: string[] = [];
            for (let i = 0; i < 256; ++i) {
                byteToHex.push((i + 0x100).toString(16).slice(1));
            }

            return (
                byteToHex[buffer[0]] +
                byteToHex[buffer[1]] +
                byteToHex[buffer[2]] +
                byteToHex[buffer[3]] + '-' +
                byteToHex[buffer[4]] +
                byteToHex[buffer[5]] + '-' +
                byteToHex[buffer[6]] +
                byteToHex[buffer[7]] + '-' +
                byteToHex[buffer[8]] +
                byteToHex[buffer[9]] + '-' +
                byteToHex[buffer[10]] +
                byteToHex[buffer[11]] +
                byteToHex[buffer[12]] +
                byteToHex[buffer[13]] +
                byteToHex[buffer[14]] +
                byteToHex[buffer[15]]
            );
        }
    }

    return `attachment-${Math.random().toString(16).slice(2)}-${Date.now().toString(16)}`;
};

export const useAttachmentManager = () => {
    const [attachments, setAttachments] = useState<any[]>([]);
    const { mutateAsync: uploadFile }  = useAttachmentUpload();

    // Use ref to track current attachments without closures
    const attachmentsRef = useRef(attachments);
    attachmentsRef.current = attachments;

    const addFiles = useCallback(async (newFiles: File[]) => {
        // Generate all new attachments first
        const newAttachments = newFiles.map(file => ({
            id: createAttachmentId(),
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
