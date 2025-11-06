// components/SignaturePreviewModal.tsx
"use client"

import { useCallback, useEffect, useRef, useState } from 'react'
import { UseQueryResult } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Loader2 } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import {useGetAttachment} from "@/hooks/api/useComplaints";
import {useUserSignaturePreview} from "@/hooks/api/useUser";

type SignatureQueryHook = (options: { path: string | null; isOpen: boolean }) => UseQueryResult<{ url: string; blob: Blob } | null>;

export function SignaturePreviewModal({
                                          signaturePath,
                                          triggerText = "Preview Signature",
                                          source = 'complaint'
                                      }: {
    signaturePath: string
    triggerText?: string
    source?: 'complaint' | 'user'
}) {
    const normalizedPath = signaturePath?.trim().length ? signaturePath : null
    const [isOpen, setIsOpen] = useState(false)
    const [imageUrl, setImageUrl] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [imageReady, setImageReady] = useState(false)
    const imagePreloadRef = useRef<HTMLImageElement | null>(null)
    const queryHook: SignatureQueryHook = source === 'user' ? useUserSignaturePreview : useGetAttachment;
    const { refetch } = queryHook({
        path: normalizedPath,
        isOpen: isOpen
    });
    const isFetchingRef = useRef(false)
    const disposePreloader = useCallback(() => {
        if (imagePreloadRef.current) {
            imagePreloadRef.current.onload = null
            imagePreloadRef.current.onerror = null
            imagePreloadRef.current = null
        }
    }, [])

    const resetImage = useCallback(() => {
        disposePreloader()
        setImageReady(false)
        setImageUrl((prev) => {
            if (prev) {
                URL.revokeObjectURL(prev)
            }
            return null
        })
    }, [disposePreloader])

    useEffect(() => {
        return () => {
            resetImage()
        }
    }, [resetImage])

    useEffect(() => {
        if (!isOpen) {
            resetImage()
        }
    }, [isOpen, resetImage])

    useEffect(() => {
        resetImage()
    }, [normalizedPath, resetImage])

    const fetchSignature = useCallback(async () => {
        if (!normalizedPath) {
            resetImage()
            return
        }
        if (isFetchingRef.current) {
            return
        }
        isFetchingRef.current = true
        try {
            setIsLoading(true)
            const result = await refetch()
            const latest = result?.data
            if (latest?.url) {
                disposePreloader()
                setImageUrl((prev) => {
                    if (prev) {
                        URL.revokeObjectURL(prev)
                    }
                    return latest.url
                })
                if (typeof window !== 'undefined') {
                    const preloadImage = new window.Image()
                    imagePreloadRef.current = preloadImage
                    preloadImage.onload = () => {
                        if (imagePreloadRef.current === preloadImage) {
                            setImageReady(true)
                        }
                    }
                    preloadImage.onerror = () => {
                        if (imagePreloadRef.current === preloadImage) {
                            setImageReady(false)
                        }
                    }
                    preloadImage.src = latest.url
                } else {
                    setImageReady(true)
                }
            } else {
                resetImage()
            }
        } catch (error) {
            console.error("Failed to load signature:", error)
            resetImage()
        } finally {
            setIsLoading(false)
            isFetchingRef.current = false
        }
    }, [disposePreloader, normalizedPath, refetch, resetImage])

    useEffect(() => {
        if (isOpen) {
            fetchSignature()
        }
    }, [fetchSignature, isOpen])

    const handleOpenChange = (open: boolean) => {
        setIsOpen(open)
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
                        <div className="relative flex w-full max-w-sm justify-center">
                            {!imageReady && (
                                <Skeleton className="h-[150px] w-[300px]" />
                            )}
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={imageUrl}
                                alt="User signature"
                                className={`border rounded max-h-[180px] object-contain transition-opacity ${imageReady ? 'opacity-100' : 'opacity-0'}`}
                                onLoad={() => setImageReady(true)}
                                onError={() => setImageReady(false)}
                            />
                        </div>
                    ) : (
                        <p className="text-muted-foreground">Signature not available</p>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
