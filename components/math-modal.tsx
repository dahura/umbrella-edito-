"use client"

import type * as React from "react"
import { useState, useEffect, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import MathRenderer from "@/lib/lexical/components/MathRenderer"
import { EDITOR_TEXTS } from "@/lib/editor-texts"

interface MathModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (equation: string, inline: boolean) => void
  initialEquation?: string
  initialInline?: boolean
}

export const MathModal: React.FC<MathModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  initialEquation = "",
  initialInline = true,
}) => {
  const [equation, setEquation] = useState(initialEquation)
  const [inline, setInline] = useState(initialInline)

  useEffect(() => {
    if (isOpen) {
      setEquation(initialEquation)
      setInline(initialInline)
    }
  }, [isOpen, initialEquation, initialInline])

  const handleConfirm = useCallback(() => {
    const cleanedEquation = equation.trim()
    if (cleanedEquation) {
      onConfirm(cleanedEquation, inline)
      onClose()
    }
  }, [equation, inline, onConfirm, onClose])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && e.ctrlKey) {
        e.preventDefault()
        handleConfirm()
      }
    },
    [handleConfirm],
  )

  const texts = EDITOR_TEXTS.mathModal

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{texts.title}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center space-x-2">
            <Checkbox id="inline" checked={inline} onCheckedChange={(checked) => setInline(checked === true)} />
            <Label htmlFor="inline">{texts.inline}</Label>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="equation">{texts.equation}</Label>
            <Textarea
              id="equation"
              value={equation}
              onChange={(e) => setEquation(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={texts.placeholder}
              className="min-h-[100px] font-mono w-full overflow-x-hidden"
            />
          </div>

          <div className="grid gap-2">
            <Label>{texts.preview}</Label>
            <div className="border rounded-md p-4 min-h-[80px] flex items-center justify-center bg-muted/30 overflow-x-auto">
              {equation.trim() ? (
                <MathRenderer equation={equation} inline={inline} />
              ) : (
                <span className="text-muted-foreground">{texts.previewPlaceholder}</span>
              )}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {texts.cancel}
          </Button>
          <Button onClick={handleConfirm} disabled={!equation.trim()}>
            {texts.confirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
