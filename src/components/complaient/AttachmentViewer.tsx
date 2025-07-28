
import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileIcon, ImageIcon, VideoIcon, Cross2Icon, DownloadIcon } from "@radix-ui/react-icons";

const AttachmentViewer = ({ attachments }: { attachments: (string | null)[] }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentAttachment, setCurrentAttachment] = useState<string | null>(null);

    // Filter out null values and create clean array of valid attachments
    const validAttachments = attachments.filter((attachment): attachment is string =>
        attachment !== null && attachment.trim() !== ''
    );

    const getFileType = (url: string) => {
        try {
            const extension = url.split('.').pop()?.toLowerCase();
            if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) {
                return 'image';
            } else if (extension === 'pdf') {
                return 'pdf';
            } else if (['mp4', 'webm', 'mov'].includes(extension || '')) {
                return 'video';
            }
            return 'other';
        } catch {
            return 'other';
        }
    };

    const getFileIcon = (url: string) => {
        const type = getFileType(url);
        switch (type) {
            case 'image':
                return <ImageIcon className="w-4 h-4 mr-2" />;
            case 'pdf':
                return <FileIcon className="w-4 h-4 mr-2" />;
            case 'video':
                return <VideoIcon className="w-4 h-4 mr-2" />;
            default:
                return <FileIcon className="w-4 h-4 mr-2" />;
        }
    };

    const getFileNameFromUrl = (url: string) => {
        try {
            return url.split('/').pop() || 'file';
        } catch {
            return 'file';
        }
    };

    const openAttachment = (url: string) => {
        setCurrentAttachment(url);
        setIsOpen(true);
    };

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
              {validAttachments.length === 1 ? (
                  'View attachment'
              ) : (
                  `View ${validAttachments.length} attachments`
              )}
          </span>
                </Button>

                {validAttachments.length > 1 && (
                    <div className="flex flex-wrap gap-1">
                        {validAttachments.slice(1).map((url, index) => (
                            <Button
                                key={index}
                                variant="outline"
                                size="sm"
                                className="h-8 px-2"
                                onClick={() => openAttachment(url)}
                            >
                                {getFileIcon(url)}
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
                            <DialogTitle>
                                {currentAttachment ? getFileNameFromUrl(currentAttachment) : 'Attachment Preview'}
                            </DialogTitle>
                            <div className="flex gap-2">
                                {currentAttachment && (
                                    <a
                                        href={currentAttachment}
                                        download
                                        className="text-primary hover:text-primary-dark"
                                    >
                                        <DownloadIcon className="w-5 h-5" />
                                    </a>
                                )}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setIsOpen(false)}
                                >
                                    <Cross2Icon className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </DialogHeader>

                    {currentAttachment ? (
                        <div className="mt-4 flex justify-center items-center">
                            {getFileType(currentAttachment) === 'image' && (
                                <img
                                    src={currentAttachment}
                                    alt="Attachment preview"
                                    className="max-w-full max-h-[70vh] object-contain mx-auto rounded-md shadow-sm"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = '/path-to-fallback-image.png';
                                    }}
                                />
                            )}

                            {getFileType(currentAttachment) === 'pdf' && (
                                <iframe
                                    src={currentAttachment}
                                    className="w-full h-[70vh] border rounded"
                                    title="PDF Viewer"
                                />
                            )}

                            {getFileType(currentAttachment) === 'video' && (
                                <video
                                    controls
                                    className="w-full max-h-[70vh] mx-auto rounded-md"
                                >
                                    <source src={currentAttachment} type={`video/${currentAttachment.split('.').pop()}`} />
                                    Your browser does not support the video tag.
                                </video>
                            )}

                            {getFileType(currentAttachment) === 'other' && (
                                <div className="flex flex-col items-center justify-center h-64 p-4 border rounded-lg">
                                    <FileIcon className="w-16 h-16 text-gray-400 mb-4" />
                                    <p className="text-lg text-center">Preview not available for this file type</p>
                                    <a
                                        href={currentAttachment}
                                        download
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