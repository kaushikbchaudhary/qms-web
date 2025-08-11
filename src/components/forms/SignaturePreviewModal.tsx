// components/SignaturePreviewModal.tsx
"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Loader2 } from 'lucide-react'
import Image from 'next/image'
import {useGetAttachment} from "@/hooks/api/useComplaints";

export function SignaturePreviewModal({
                                          signaturePath,
                                          triggerText = "Preview Signature"
                                      }: {
    signaturePath: string
    triggerText?: string
}) {
    const [isOpen, setIsOpen] = useState(false)
    const [imageUrl, setImageUrl] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const { data: attachmentData, isLoading:imageFetching, error, refetch } = useGetAttachment({
        path: signaturePath,
        isOpen: isOpen
    });
    const fetchSignature = async () => {
        try {
            setIsLoading(true)
            await refetch();
            attachmentData?.url && setImageUrl(attachmentData.url )
        } catch (error) {
            console.error("Failed to load signature:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleOpenChange = (open: boolean) => {
        setIsOpen(open)
        if (open && !imageUrl) {
            fetchSignature()
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    {triggerText}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Signature Preview</DialogTitle>
                </DialogHeader>
                <div className="flex justify-center py-4">
                    {isLoading ? (
                        <Loader2 className="h-8 w-8 animate-spin" />
                    ) : imageUrl ? (
                        <Image
                            src={imageUrl}
                            alt="User signature"
                            width={300}
                            height={150}
                            className="border rounded"
                            onLoad={() => URL.revokeObjectURL(imageUrl)} // Clean up memory
                        />
                    ) : (
                        <p className="text-muted-foreground">Signature not available</p>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}