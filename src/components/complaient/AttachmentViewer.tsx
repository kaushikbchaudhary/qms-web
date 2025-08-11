import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileIcon, ImageIcon, VideoIcon, Cross2Icon, DownloadIcon, ReloadIcon } from "@radix-ui/react-icons";
import {complaintsApi} from "@/lib/api/endpoints/complaints";

const AttachmentViewer = ({ attachments }: { attachments: (string | null)[] }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentAttachment, setCurrentAttachment] = useState<string | null>(null);

    // Filter out null values and create clean array of valid attachments
    const validAttachments = attachments.filter((attachment): attachment is string =>
        attachment !== null && attachment.trim() !== ''
    );

    // Query to fetch attachment data
    const { data: attachmentData, isLoading, error, refetch } = useQuery({
        queryKey: ['complaint-attachment', currentAttachment],
        queryFn: async () => {
            if (!currentAttachment) return null;

            const response = await complaintsApi.getAttachment({ path: currentAttachment });
            return {
                url: response.url,
                type: getFileType(currentAttachment),
                blob: response.blob
            };
        },
        enabled: !!currentAttachment && isOpen,
        gcTime: 10 * 60 * 1000, // 10 minutes cache
        staleTime: 5 * 60 * 1000, // 5 minutes stale time
    });

    const getFileType = (path: string) => {
        const extension = path.split('.').pop()?.toLowerCase();
        if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) {
            return 'image';
        } else if (extension === 'pdf') {
            return 'pdf';
        } else if (['mp4', 'webm', 'mov'].includes(extension || '')) {
            return 'video';
        }
        return 'other';
    };

    const getFileIcon = (path: string) => {
        const type = getFileType(path);
        switch (type) {
            case 'image': return <ImageIcon className="w-4 h-4 mr-2" />;
            case 'pdf': return <FileIcon className="w-4 h-4 mr-2" />;
            case 'video': return <VideoIcon className="w-4 h-4 mr-2" />;
            default: return <FileIcon className="w-4 h-4 mr-2" />;
        }
    };

    const getFileNameFromUrl = (path: string) => {
        return path.split('/').pop() || 'file';
    };

    const openAttachment = (path: string) => {
        setCurrentAttachment(path);
        setIsOpen(true);
    };

    useEffect(() => {
        return () => {
            // Clean up object URLs when component unmounts
            if (attachmentData?.url) {
                URL.revokeObjectURL(attachmentData.url);
            }
        };
    }, [attachmentData]);
    if (validAttachments.length === 0) {
        return <span className="text-muted-foreground">None</span>;
    }

    return (
        <div>
            <div className="flex flex-col space-y-2">
                <Button
                    variant="ghost"
                    size="sm"
                    className="w-fit h-8 px-2"
                    onClick={() => openAttachment(validAttachments[0])}
                >
          <span className="flex items-center">
            {getFileIcon(validAttachments[0])}
              {validAttachments.length === 1 ? 'View attachment' : `View ${validAttachments.length} attachments`}
          </span>
                </Button>

                {validAttachments.length > 1 && (
                    <div className="flex flex-wrap gap-1">
                        {validAttachments.slice(1).map((path, index) => (
                            <Button
                                key={index}
                                variant="outline"
                                size="sm"
                                className="h-8 px-2"
                                onClick={() => openAttachment(path)}
                            >
                                {getFileIcon(path)}
                                File {index + 2}
                            </Button>
                        ))}
                    </div>
                )}
            </div>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="max-w-[90vw] max-h-[90vh] overflow-auto">
                    <DialogHeader>
                        <div className="flex justify-between items-center">

                            <div className="flex gap-2">
                                {attachmentData?.url && (
                                    <a
                                        href={attachmentData.url}
                                        download={getFileNameFromUrl(currentAttachment || '')}
                                        className="text-primary hover:text-primary-dark mx-1"
                                    >
                                        <DownloadIcon className="w-5 h-5" />
                                    </a>
                                )}
                            </div>
                            <DialogTitle>
                                {currentAttachment ? getFileNameFromUrl(currentAttachment) : 'Attachment Preview'}
                            </DialogTitle>
                        </div>
                    </DialogHeader>

                    {isLoading ? (
                        <div className="flex justify-center items-center h-64">
                            <ReloadIcon className="w-8 h-8 animate-spin" />
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center h-64 p-4">
                            <FileIcon className="w-16 h-16 text-gray-400 mb-4" />
                            <p className="text-lg text-center">Failed to load attachment</p>
                            <Button
                                variant="outline"
                                className="mt-4"
                                onClick={() => refetch()}
                            >
                                <ReloadIcon className="w-4 h-4 mr-2" />
                                Retry
                            </Button>
                        </div>
                    ) : attachmentData ? (
                        <div className="mt-4 flex justify-center items-center">
                            {attachmentData.type === 'image' && (
                                <img
                                    src={attachmentData.url}
                                    alt="Attachment preview"
                                    className="max-w-full max-h-[70vh] object-contain mx-auto rounded-md shadow-sm"
                                />
                            )}

                            {attachmentData.type === 'pdf' && (
                                <iframe
                                    src={attachmentData.url}
                                    className="w-full h-[70vh] border rounded"
                                    title="PDF Viewer"
                                />
                            )}

                            {attachmentData.type === 'video' && (
                                <video
                                    controls
                                    className="w-full max-h-[70vh] mx-auto rounded-md"
                                >
                                    <source src={attachmentData.url} type={`video/${currentAttachment?.split('.').pop()}`} />
                                    Your browser does not support the video tag.
                                </video>
                            )}

                            {attachmentData.type === 'other' && (
                                <div className="flex flex-col items-center justify-center h-64 p-4 border rounded-lg">
                                    <FileIcon className="w-16 h-16 text-gray-400 mb-4" />
                                    <p className="text-lg text-center">Preview not available for this file type</p>
                                    <a
                                        href={attachmentData.url}
                                        download={getFileNameFromUrl(currentAttachment || '')}
                                        className="mt-4 text-primary hover:underline flex items-center gap-2"
                                    >
                                        <DownloadIcon className="w-4 h-4" />
                                        Download file
                                    </a>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-64">
                            <FileIcon className="w-16 h-16 text-gray-400 mb-4" />
                            <p className="text-lg">No attachment selected</p>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};


export default AttachmentViewer;