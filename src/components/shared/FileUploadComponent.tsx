import React, { useCallback, useState, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { FileRejection } from 'react-dropzone';
import {useMutation, UseMutationResult} from '@tanstack/react-query';
import { AxiosRequestConfig } from 'axios';
import {useAttachmentUpload} from "@/hooks/api/useComplaints";

interface FileUploadComponentProps {
    uploadApiHook: () => UseMutationResult<any, unknown, File, unknown>;
    onUploadSuccess?: (response: any) => void;
    onUploadError?: (error: Error) => void;
    multiple?: boolean;
    accept?: string;
    maxSize?: number;
    maxFiles?: number;
    label?: string;
    description?: string;
    className?: string;
    showPreview?: boolean;
    additionalFields?: Record<string, string | number>;
}

const FileUploadComponent: React.FC<FileUploadComponentProps> = ({
                                                                     uploadApiHook,
                                                                     onUploadSuccess,
                                                                     onUploadError,
                                                                     multiple = false,
                                                                     accept = '*',
                                                                     maxSize = 10 * 1024 * 1024, // 10MB default
                                                                     maxFiles = 5,
                                                                     label = 'Upload files',
                                                                     description = 'Drag & drop files here, or click to select files',
                                                                     className = '',
                                                                     showPreview = true,
                                                                     additionalFields = {},
                                                                 }) => {
    const [files, setFiles] = useState<Array<{ file: File; preview?: string; progress?: number; error?: string }>>([]);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { mutate: uploadMutation, isPending } = uploadApiHook();

    const onDrop = useCallback(
        (acceptedFiles: File[], fileRejections: FileRejection[]) => {
            setIsDragging(false);

            // Handle rejected files (e.g., too large, wrong type)
            if (fileRejections.length > 0) {
                const rejectedFiles = fileRejections.map(({ file, errors }) => ({
                    file,
                    error: errors.map(e => e.message).join(', '),
                }));
                setFiles(prev => [...prev, ...rejectedFiles]);
                return;
            }

            // Handle accepted files
            const newFiles = acceptedFiles.map(file => {
                const fileWithPreview = {
                    file,
                    preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
                    progress: 0,
                };
                return fileWithPreview;
            });

            setFiles(prev => {
                // If not multiple, replace all files
                if (!multiple) return newFiles;

                // If multiple but has maxFiles limit
                if (maxFiles && prev.length + newFiles.length > maxFiles) {
                    const remainingSlots = maxFiles - prev.length;
                    return [...prev, ...newFiles.slice(0, remainingSlots)];
                }

                return [...prev, ...newFiles];
            });

            // Auto-upload if files are added
            if(acceptedFiles.length > 0 ){
                acceptedFiles.forEach(file => uploadMutation(file));
            }
        },
        [multiple, maxFiles]
    );

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        onDragEnter: () => setIsDragging(true),
        onDragLeave: () => setIsDragging(false),
        accept: accept !== '*' ? { [accept]: [] } : undefined,
        maxSize,
        multiple,
        maxFiles,
        noClick: true, // We'll handle click via the button
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
            if (removedFile.preview) {
                URL.revokeObjectURL(removedFile.preview);
            }
            return newFiles;
        });
    };

    const retryUpload = (file: File) => {
        uploadMutation(file);
    };

    return (
        <div className={`file-upload-container ${className}`}>
            <div
                {...getRootProps()}
                className={`dropzone ${isDragActive || isDragging ? 'active' : ''}`}
            >
                <input {...getInputProps()} />
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileInputChange}
                    style={{ display: 'none' }}
                    accept={accept}
                    multiple={multiple}
                />

                <div className="upload-content">
                    <div className="upload-icon">
                        <svg /* Upload icon SVG */ />
                    </div>
                    <h4>{label}</h4>
                    <p>{description}</p>
                    <button
                        type="button"
                        onClick={triggerFileInput}
                        className="select-files-button"
                        disabled={isPending}
                    >
                        Select Files
                    </button>
                    {accept !== '*' && (
                        <p className="file-types">Accepted file types: {accept}</p>
                    )}
                    <p className="file-size">Max file size: {maxSize / (1024 * 1024)}MB</p>
                    {multiple && maxFiles && (
                        <p className="file-count">Max files: {maxFiles}</p>
                    )}
                </div>
            </div>

            {files.length > 0 && (
                <div className="file-list">
                    {files.map((fileData, index) => (
                        <div key={`${fileData.file.name}-${index}`} className="file-item">
                            {showPreview && fileData.preview && (
                                <div className="file-preview">
                                    <img src={fileData.preview} alt="Preview" />
                                </div>
                            )}
                            <div className="file-info">
                                <div className="file-name">{fileData.file.name}</div>
                                <div className="file-size">
                                    {(fileData.file.size / (1024 * 1024)).toFixed(2)} MB
                                </div>
                                {fileData.error ? (
                                    <div className="file-error">
                                        <span>{fileData.error}</span>
                                        <button onClick={() => retryUpload(fileData.file)}>Retry</button>
                                    </div>
                                ) : (
                                    <div className="file-progress">
                                        <progress value={fileData.progress || 0} max="100" />
                                        <span>{fileData.progress || 0}%</span>
                                    </div>
                                )}
                            </div>
                            <button
                                className="remove-file"
                                onClick={() => removeFile(index)}
                                disabled={isPending}
                            >
                                &times;
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default FileUploadComponent;