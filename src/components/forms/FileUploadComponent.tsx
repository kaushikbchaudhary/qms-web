// components/FileUploadComponent.tsx
import { useAttachmentManager} from './AttachmentManager';
import {useEffect, useState} from "react";
import {useDropzone} from "react-dropzone";
import {UploadCloud, X} from "lucide-react";
import {Button} from "@/components/ui/button";

export const FileUploadComponent = ({addAttachmentPath}: {addAttachmentPath:any}) => {
    const { attachments, addFiles, removeFile } = useAttachmentManager();
    const [isDragging, setIsDragging] = useState(false);

    useEffect(() => {
        addAttachmentPath([]);
        // Update form state with current attachments
        addAttachmentPath(attachments.map((attachment) => attachment.path));

        // Clean up object URLs when component unmounts
        return () => {
            attachments.forEach((attachment) => {
                if (attachment.preview) {
                    URL.revokeObjectURL(attachment.preview);
                }
            });
        };
    },[attachments])

    const { getRootProps, getInputProps } = useDropzone({
        onDrop: (acceptedFiles) => {
            addFiles(acceptedFiles);
        },
        onDragEnter: () => setIsDragging(true),
        onDragLeave: () => setIsDragging(false),
        accept: {
            'image/*': ['.jpeg', '.jpg', '.png'],
            'application/pdf': ['.pdf']
        },
        maxSize: 10 * 1024 * 1024, // 10MB
        multiple: true
    });

    return (
        <div className="space-y-4">
            <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-6 ${
                    isDragging ? 'border-primary bg-muted/50' : 'border-muted'
                }`}
            >
                <input {...getInputProps()} />
                <div className="text-center">
                    <UploadCloud className="mx-auto h-10 w-10 text-muted-foreground" />
                    <h4 className="mt-3 font-medium">Upload documents</h4>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Drag & drop files here, or click to select files
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                        Supports JPG, PNG, and PDF files up to 10MB
                    </p>
                </div>
            </div>

            <div className="space-y-2">
                {attachments.map((attachment) => (
                    <AttachmentItem
                        key={attachment.id}
                        attachment={attachment}
                        onRemove={() => removeFile(attachment.id)}
                    />
                ))}
            </div>
        </div>
    );
};

const AttachmentItem = ({ attachment, onRemove }: {
    attachment: any;
    onRemove: () => void;
}) => {
    return (
        <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-4">
                {attachment.preview && (
                    <div className="flex-shrink-0 w-10 h-10">
                        <img
                            src={attachment.preview}
                            alt="Preview"
                            className="object-cover w-full h-full rounded-md"
                        />
                    </div>
                )}
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{attachment.file.name}</p>
                    <div className="flex items-center gap-2">
                        {attachment.status === 'uploading' && (
                            <>
                                {/*<Spinner size="sm" />*/}
                                <span className="text-xs text-muted-foreground">Uploading...</span>
                            </>
                        )}
                        {attachment.status === 'error' && (
                            <span className="text-xs text-destructive">Upload failed</span>
                        )}
                        {attachment.status === 'success' && (
                            <span className="text-xs text-muted-foreground">Ready</span>
                        )}
                    </div>
                </div>
            </div>
            <Button
                variant="ghost"
                size="icon"
                className="w-6 h-6 rounded-full"
                onClick={onRemove}
            >
                <X className="w-3 h-3" />
            </Button>
        </div>
    );
};