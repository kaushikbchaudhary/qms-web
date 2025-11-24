/* eslint-disable @next/next/no-img-element */
import React, { useCallback, useState, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { FileRejection } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { X, UploadCloud } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileWithPreview {
    file: File;
    preview?: string;
    error?: string;
}

interface FileUploadComponentProps {
    multiple?: boolean;
    accept?: string | undefined;
    maxSize?: number;
    maxFiles?: number;
    label?: string;
    description?: string;
    className?: string;
    showPreview?: boolean;
    onFilesChange?: (files: File[]) => void;
    disabled?: boolean;
}

const FileUploadComponent = React.forwardRef<HTMLDivElement, FileUploadComponentProps>(
    (
        {
            multiple = false,
            accept = '*',
            maxSize = 10 * 1024 * 1024,
            maxFiles = 5,
            label = 'Upload files',
            description = 'Drag & drop files here, or click to select files',
            className = '',
            showPreview = true,
            onFilesChange,
            disabled = false,
        },
        ref
    ) => {
        const [files, setFiles] = useState<FileWithPreview[]>([]);
        const fileInputRef = useRef<HTMLInputElement>(null);
        // Use useEffect to notify parent of file changes after render
        useEffect(() => {
            if (onFilesChange) {
                onFilesChange(files.map(f => f.file));
            }
        }, [files, onFilesChange]);

        const onDrop = useCallback(
            (acceptedFiles: File[], fileRejections: FileRejection[]) => {
                // Handle rejected files
                if (fileRejections.length > 0) {
                    const rejectedFiles = fileRejections.map(({ file, errors }) => ({
                        file,
                        error: errors.map(e => e.message).join(', '),
                    }));
                    setFiles(prev => [...prev, ...rejectedFiles]);
                    return;
                }

                // Handle accepted files
                const newFiles = acceptedFiles.map(file => ({
                    file,
                    preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
                }));

                setFiles(prev => {
                    let updatedFiles;

                    if (!multiple) {
                        updatedFiles = newFiles;
                    } else if (maxFiles && prev.length + newFiles.length > maxFiles) {
                        const remainingSlots = maxFiles - prev.length;
                        updatedFiles = [...prev, ...newFiles.slice(0, remainingSlots)];
                    } else {
                        updatedFiles = [...prev, ...newFiles];
                    }

                    return updatedFiles;
                });
            },
            [multiple, maxFiles]
        );

        const { getRootProps, isDragActive } = useDropzone({
            onDrop,
            // accept: accept === '*' ? accept? accept : undefined : accept,
            maxSize,
            multiple,
            maxFiles,
            noClick: true,
            disabled,
        });

        const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            if (e.target.files && e.target.files.length > 0) {
                const fileList = Array.from(e.target.files);
                onDrop(fileList, []);
            }
        };

        const triggerFileInput = () => {
            fileInputRef.current?.click();
        };

        const removeFile = (index: number) => {
            setFiles(prev => {
                const newFiles = [...prev];
                const removedFile = newFiles.splice(index, 1)[0];
                if (removedFile.preview) URL.revokeObjectURL(removedFile.preview);
                return newFiles;
            });
        };

        return (
            <div className={cn('space-y-4', className)} ref={ref}>
                <Card
                    {...getRootProps()}
                    className={cn(
                        'border-2 border-dashed hover:border-primary transition-colors',
                        isDragActive && 'border-primary bg-muted/50',
                        disabled && 'opacity-50 cursor-not-allowed'
                    )}
                >
                    <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                        <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground" />
                        <h4 className="text-lg font-medium">{label}</h4>
                        <p className="text-sm text-muted-foreground mb-4">{description}</p>
                        <Button
                            type="button"
                            onClick={triggerFileInput}
                            variant="outline"
                            size="sm"
                            disabled={disabled}
                        >
                            Select Files
                        </Button>
                        <div className="mt-2 text-xs text-muted-foreground">
                            {accept !== '*' && <p>Accepted: {accept}</p>}
                            <p>Max size: {maxSize / (1024 * 1024)}MB</p>
                            {multiple && maxFiles && <p>Max files: {maxFiles}</p>}
                        </div>
                        <Input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileInputChange}
                            className="hidden"
                            accept={accept}
                            multiple={multiple}
                            disabled={disabled}
                        />
                    </CardContent>
                </Card>

                {files.length > 0 && (
                    <div className="space-y-2">
                        {files.map((fileData, index) => (
                            <div
                                key={`${fileData.file.name}-${index}`}
                                className="flex items-center justify-between p-3 border rounded-lg"
                            >
                                <div className="flex items-center space-x-4">
                                    {showPreview && fileData.preview && (
                                        <div className="flex-shrink-0 w-10 h-10">
                                            <img
                                                src={fileData.preview}
                                                alt="Preview"
                                                className="object-cover w-full h-full rounded-md"
                                            />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{fileData.file.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {(fileData.file.size / (1024 * 1024)).toFixed(2)} MB
                                        </p>
                                        {fileData.error && (
                                            <p className="text-xs text-destructive">{fileData.error}</p>
                                        )}
                                    </div>
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="w-6 h-6 rounded-full"
                                    onClick={() => removeFile(index)}
                                    disabled={disabled}
                                >
                                    <X className="w-3 h-3" />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }
);

FileUploadComponent.displayName = 'FileUploadComponent';

export { FileUploadComponent };
