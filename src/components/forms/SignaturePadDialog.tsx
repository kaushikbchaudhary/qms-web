"use client"

import { useCallback, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

interface SignaturePadDialogProps {
    triggerLabel?: string
    disabled?: boolean
    onSave: (file: File) => Promise<void>
}

const CANVAS_WIDTH = 500
const CANVAS_HEIGHT = 200

export function SignaturePadDialog({ triggerLabel = 'Draw Signature', disabled, onSave }: SignaturePadDialogProps) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const drawingRef = useRef(false)
    const [isOpen, setIsOpen] = useState(false)
    const [isSaving, setIsSaving] = useState(false)

    const getContext = () => {
        const canvas = canvasRef.current
        if (!canvas) return null
        const context = canvas.getContext('2d')
        if (context) {
            context.lineWidth = 2
            context.lineCap = 'round'
            context.strokeStyle = '#111827'
        }
        return context
    }

    const startDrawing = useCallback((event: React.PointerEvent<HTMLCanvasElement>) => {
        const ctx = getContext()
        if (!ctx) return
        drawingRef.current = true
        const rect = (event.target as HTMLCanvasElement).getBoundingClientRect()
        ctx.beginPath()
        ctx.moveTo(event.clientX - rect.left, event.clientY - rect.top)
    }, [])

    const draw = useCallback((event: React.PointerEvent<HTMLCanvasElement>) => {
        if (!drawingRef.current) return
        const ctx = getContext()
        if (!ctx) return
        const rect = (event.target as HTMLCanvasElement).getBoundingClientRect()
        ctx.lineTo(event.clientX - rect.left, event.clientY - rect.top)
        ctx.stroke()
    }, [])

    const stopDrawing = useCallback(() => {
        const ctx = getContext()
        if (!ctx) return
        ctx.closePath()
        drawingRef.current = false
    }, [])

    const handleClear = () => {
        const ctx = getContext()
        if (!ctx) return
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    }

    const handleSave = async () => {
        const canvas = canvasRef.current
        if (!canvas) return
        setIsSaving(true)
        try {
            const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
            if (!blob) return
            const file = new File([blob], `signature-${Date.now()}.png`, { type: 'image/png' })
            await onSave(file)
            handleClear()
            setIsOpen(false)
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            if (!disabled) setIsOpen(open)
        }}>
            <Button type="button" variant="outline" disabled={disabled} onClick={() => setIsOpen(true)}>
                {triggerLabel}
            </Button>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>Draw digital signature</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <canvas
                        ref={canvasRef}
                        width={CANVAS_WIDTH}
                        height={CANVAS_HEIGHT}
                        className={cn('w-full border border-dashed rounded-md bg-white cursor-crosshair')}
                        onPointerDown={startDrawing}
                        onPointerMove={draw}
                        onPointerUp={stopDrawing}
                        onPointerLeave={stopDrawing}
                    />
                    <div className="flex justify-between">
                        <Button type="button" variant="ghost" onClick={handleClear}>
                            Clear
                        </Button>
                        <DialogFooter className="flex gap-2">
                            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="button" onClick={handleSave} disabled={isSaving}>
                                {isSaving ? 'Saving…' : 'Save signature'}
                            </Button>
                        </DialogFooter>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
