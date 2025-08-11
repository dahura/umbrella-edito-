"use client"

import type * as React from "react"
import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, AlertTriangle, Loader, Shield, MessageSquareWarning, Heart, Mail } from "lucide-react"
import { cn } from "@/lib/utils"

interface TextAnalysisResult {
  categories: string[]
  isAnalyzing: boolean
}

interface TextAnalyzerProps {
  text: string
  className?: string
}

// Вызов нашего backend-агента для анализа текста
const analyzeText = async (text: string): Promise<string[]> => {
  if (!text.trim()) return ["safe"]

  const mapServerCategoryToUi = (category: string): string => {
    switch (category) {
      case "Hate speech":
        return "hate speech"
      case "Violence":
        return "violence"
      case "Sexual content":
        return "sexual content"
      case "Spam":
        return "spam"
      default:
        return category
    }
  }

  const res = await fetch("/api/guard", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  })

  if (!res.ok) {
    throw new Error(`Guard API error: ${res.status}`)
  }

  const data = (await res.json()) as {
    status: "safe" | "unsafe"
    categories: string[]
  }

  if (data.status === "safe") return ["safe"]
  return data.categories.map(mapServerCategoryToUi)
}

const getCategoryConfig = (category: string) => {
  switch (category) {
    case "safe":
      return {
        icon: CheckCircle,
        color: "text-green-600",
        bgColor: "bg-green-50",
        borderColor: "border-green-200",
        badgeVariant: "default" as const,
        badgeClass: "bg-green-100 text-green-800 hover:bg-green-100",
        label: "Безопасно",
        message: "Контент не содержит потенциально вредной информации и безопасен для всех пользователей.",
      }
    case "hate speech":
      return {
        icon: MessageSquareWarning,
        color: "text-red-600",
        bgColor: "bg-red-50",
        borderColor: "border-red-200",
        badgeVariant: "destructive" as const,
        badgeClass: "bg-red-100 text-red-800 hover:bg-red-100",
        label: "Язык вражды",
        message:
          "Контент содержит оскорбительные высказывания, которые могут причинить эмоциональный вред и способствовать дискриминации.",
      }
    case "violence":
      return {
        icon: AlertTriangle,
        color: "text-red-600",
        bgColor: "bg-red-50",
        borderColor: "border-red-200",
        badgeVariant: "destructive" as const,
        badgeClass: "bg-red-100 text-red-800 hover:bg-red-100",
        label: "Насилие",
        message:
          "Контент содержит описания насилия, которые могут травмировать читателей и способствовать агрессивному поведению.",
      }
    case "sexual content":
      return {
        icon: Heart,
        color: "text-red-600",
        bgColor: "bg-red-50",
        borderColor: "border-red-200",
        badgeVariant: "destructive" as const,
        badgeClass: "bg-red-100 text-red-800 hover:bg-red-100",
        label: "Взрослый контент",
        message:
          "Контент содержит материалы сексуального характера, неподходящие для несовершеннолетних и некоторых аудиторий.",
      }
    case "spam":
      return {
        icon: Mail,
        color: "text-red-600",
        bgColor: "bg-red-50",
        borderColor: "border-red-200",
        badgeVariant: "destructive" as const,
        badgeClass: "bg-red-100 text-red-800 hover:bg-red-100",
        label: "Спам",
        message:
          "Контент содержит навязчивую рекламу или мошеннические предложения, которые могут ввести в заблуждение пользователей.",
      }
    default:
      return {
        icon: Shield,
        color: "text-gray-600",
        bgColor: "bg-gray-50",
        borderColor: "border-gray-200",
        badgeVariant: "secondary" as const,
        badgeClass: "bg-gray-100 text-gray-800 hover:bg-gray-100",
        label: category,
        message: "Неизвестная категория контента.",
      }
  }
}

export const TextAnalyzer: React.FC<TextAnalyzerProps> = ({ text, className }) => {
  const [analysis, setAnalysis] = useState<TextAnalysisResult>({
    categories: ["safe"],
    isAnalyzing: false,
  })

  // Debounce функция для анализа текста
  const debouncedAnalyze = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout
      return (textToAnalyze: string) => {
        clearTimeout(timeoutId)
        timeoutId = setTimeout(async () => {
          if (!textToAnalyze.trim()) {
            setAnalysis({ categories: ["safe"], isAnalyzing: false })
            return
          }

          setAnalysis((prev) => ({ ...prev, isAnalyzing: true }))

          try {
            const categories = await analyzeText(textToAnalyze)
            setAnalysis({ categories, isAnalyzing: false })
          } catch (error) {
            console.error("Error analyzing text:", error)
            setAnalysis({ categories: ["safe"], isAnalyzing: false })
          }
        }, 1500) // Анализ начинается через 1.5 секунды после остановки печати
      }
    })(),
    [],
  )

  useEffect(() => {
    debouncedAnalyze(text)
  }, [text, debouncedAnalyze])

  const primaryCategory = analysis.categories[0] || "safe"
  const config = getCategoryConfig(primaryCategory)
  const Icon = config.icon

  return (
    <Card className={cn("w-full", className)}>
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Анализ текста</span>
          </div>

          {analysis.isAnalyzing ? (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 border border-blue-200">
              <Loader className="h-4 w-4 text-blue-600 animate-spin" />
              <span className="text-sm text-blue-700">Анализируем текст...</span>
            </div>
          ) : (
            <div className="space-y-3">
              <div className={cn("flex items-center gap-2 p-3 rounded-lg border", config.bgColor, config.borderColor)}>
                <Icon className={cn("h-4 w-4", config.color)} />
                <span className={cn("text-sm font-medium", config.color)}>{config.label}</span>
              </div>

              {/* Описательное сообщение */}
              <div className="p-3 rounded-lg bg-muted/50 border">
                <p className="text-xs text-muted-foreground leading-relaxed">{config.message}</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
