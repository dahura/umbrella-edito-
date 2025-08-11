"use client";

import type * as React from "react";
import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  CheckCircle,
  AlertTriangle,
  Loader,
  Shield,
  MessageSquareWarning,
  Heart,
  Mail,
  X,
  Move,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { EDITOR_TEXTS } from "@/lib/editor-texts";

interface TextAnalysisResult {
  categories: string[];
  isAnalyzing: boolean;
}

interface TextAnalyzerWidgetProps {
  text: string;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange: (status: "safe" | "warning" | "analyzing") => void;
}

// Call our backend agent to analyze text
const analyzeText = async (text: string): Promise<string[]> => {
  if (!text.trim()) return ["safe"];

  const mapServerCategoryToUi = (category: string): string => {
    switch (category) {
      case "Hate speech":
        return "hateSpeech";
      case "Violence":
        return "violence";
      case "Sexual content":
        return "sexualContent";
      case "Spam":
        return "spam";
      case "Harassment and bullying":
        return "harassmentAndBullying";
      case "Self-harm or suicide encouragement":
        return "selfHarmOrSuicideEncouragement";
      case "Illegal activities":
        return "illegalActivities";
      case "Misinformation / fake news":
        return "misinformationFakeNews";
      case "Terrorism-related content":
        return "terrorismRelatedContent";
      case "Hate symbols and extremist content":
        return "hateSymbolsAndExtremistContent";
      default:
        return category.toLowerCase().replace(/\s+/g, "");
    }
  };

  const res = await fetch("/api/guard", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });

  if (!res.ok) {
    throw new Error(`Guard API error: ${res.status}`);
  }

  const data = (await res.json()) as {
    status: "safe" | "unsafe";
    categories: string[];
  };

  if (data.status === "safe") return ["safe"];
  return data.categories.map(mapServerCategoryToUi);
};

const getCategoryConfig = (category: string) => {
  const texts = EDITOR_TEXTS.analysis.categories;

  switch (category) {
    case "safe":
      return {
        icon: CheckCircle,
        color: "text-green-600",
        bgColor: "bg-green-50",
        borderColor: "border-green-200",
        label: texts.safe.label,
        message: texts.safe.message,
      };
    case "hateSpeech":
      return {
        icon: MessageSquareWarning,
        color: "text-red-600",
        bgColor: "bg-red-50",
        borderColor: "border-red-200",
        label: texts.hateSpeech.label,
        message: texts.hateSpeech.message,
      };
    case "violence":
      return {
        icon: AlertTriangle,
        color: "text-red-600",
        bgColor: "bg-red-50",
        borderColor: "border-red-200",
        label: texts.violence.label,
        message: texts.violence.message,
      };
    case "sexualContent":
      return {
        icon: Heart,
        color: "text-red-600",
        bgColor: "bg-red-50",
        borderColor: "border-red-200",
        label: texts.sexualContent.label,
        message: texts.sexualContent.message,
      };
    case "spam":
      return {
        icon: Mail,
        color: "text-red-600",
        bgColor: "bg-red-50",
        borderColor: "border-red-200",
        label: texts.spam.label,
        message: texts.spam.message,
      };
    case "harassmentAndBullying":
      return {
        icon: AlertTriangle,
        color: "text-red-600",
        bgColor: "bg-red-50",
        borderColor: "border-red-200",
        label: texts.harassmentAndBullying.label,
        message: texts.harassmentAndBullying.message,
      };
    case "selfHarmOrSuicideEncouragement":
      return {
        icon: AlertTriangle,
        color: "text-red-600",
        bgColor: "bg-red-50",
        borderColor: "border-red-200",
        label: texts.selfHarmOrSuicideEncouragement.label,
        message: texts.selfHarmOrSuicideEncouragement.message,
      };
    case "illegalActivities":
      return {
        icon: AlertTriangle,
        color: "text-red-600",
        bgColor: "bg-red-50",
        borderColor: "border-red-200",
        label: texts.illegalActivities.label,
        message: texts.illegalActivities.message,
      };
    case "misinformationFakeNews":
      return {
        icon: AlertTriangle,
        color: "text-red-600",
        bgColor: "bg-red-50",
        borderColor: "border-red-200",
        label: texts.misinformationFakeNews.label,
        message: texts.misinformationFakeNews.message,
      };
    case "terrorismRelatedContent":
      return {
        icon: AlertTriangle,
        color: "text-red-600",
        bgColor: "bg-red-50",
        borderColor: "border-red-200",
        label: texts.terrorismRelatedContent.label,
        message: texts.terrorismRelatedContent.message,
      };
    case "hateSymbolsAndExtremistContent":
      return {
        icon: AlertTriangle,
        color: "text-red-600",
        bgColor: "bg-red-50",
        borderColor: "border-red-200",
        label: texts.hateSymbolsAndExtremistContent.label,
        message: texts.hateSymbolsAndExtremistContent.message,
      };
    default:
      return {
        icon: Shield,
        color: "text-gray-600",
        bgColor: "bg-gray-50",
        borderColor: "border-gray-200",
        label: category,
        message: "Unknown content category.",
      };
  }
};

export const TextAnalyzerWidget: React.FC<TextAnalyzerWidgetProps> = ({
  text,
  isOpen,
  onClose,
  onStatusChange,
}) => {
  const [analysis, setAnalysis] = useState<TextAnalysisResult>({
    categories: ["safe"],
    isAnalyzing: false,
  });
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const widgetRef = useRef<HTMLDivElement>(null);

  // Debounce function for text analysis
  const debouncedAnalyze = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout;
      return (textToAnalyze: string) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(async () => {
          if (!textToAnalyze.trim()) {
            setAnalysis({ categories: ["safe"], isAnalyzing: false });
            onStatusChange("safe");
            return;
          }

          setAnalysis((prev) => ({ ...prev, isAnalyzing: true }));
          onStatusChange("analyzing");

          try {
            const categories = await analyzeText(textToAnalyze);
            setAnalysis({ categories, isAnalyzing: false });

            // Determine status for the parent component
            const hasBadContent = categories.some((cat) => cat !== "safe");
            onStatusChange(hasBadContent ? "warning" : "safe");
          } catch (error) {
            console.error("Error analyzing text:", error);
            setAnalysis({ categories: ["safe"], isAnalyzing: false });
            onStatusChange("safe");
          }
        }, 1500);
      };
    })(),
    [onStatusChange]
  );

  useEffect(() => {
    debouncedAnalyze(text);
  }, [text, debouncedAnalyze]);

  // Drag handling – now for the whole widget
  const handleMouseDown = (e: React.MouseEvent) => {
    // Do not start dragging if clicked on the close button or inside the scroll area
    if (
      (e.target as HTMLElement).closest('button[aria-label="close"]') ||
      (e.target as HTMLElement).closest("[data-radix-scroll-area-viewport]")
    ) {
      return;
    }

    if (!widgetRef.current) return;

    const rect = widgetRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    setIsDragging(true);

    // Prevent text selection while dragging
    e.preventDefault();
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;

      setPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y,
      });
    },
    [isDragging, dragOffset]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  if (!isOpen) return null;

  // Get configs for all detected categories
  const categoryConfigs = analysis.categories.map((category) =>
    getCategoryConfig(category)
  );

  // Determine overall widget status (show warning if there are issues)
  const hasProblems = analysis.categories.some((cat) => cat !== "safe");
  const overallStatus = hasProblems ? "warning" : "safe";

  return (
    <div
      ref={widgetRef}
      className={cn(
        "fixed z-50 w-96 shadow-lg select-none",
        isDragging ? "cursor-grabbing" : "cursor-grab"
      )}
      style={{
        left: position.x,
        top: position.y,
      }}
      onMouseDown={handleMouseDown}
    >
      <Card className="border-2">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">
                {EDITOR_TEXTS.contentGuard.widgetTitle}
              </span>
              {!analysis.isAnalyzing && analysis.categories.length > 1 && (
                <span className="text-xs bg-muted px-2 py-1 rounded-full">
                  {analysis.categories.length} issues
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Move className="h-3 w-3 text-muted-foreground" />
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 cursor-pointer"
                onClick={onClose}
                aria-label="close"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {analysis.isAnalyzing ? (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 border border-blue-200">
              <Loader className="h-4 w-4 text-blue-600 animate-spin" />
              <span className="text-sm text-blue-700">
                {EDITOR_TEXTS.contentGuard.analyzing}
              </span>
            </div>
          ) : (
            <ScrollArea className="h-[300px] w-full">
              <div className="space-y-3 pr-4">
                {/* Analysis Results */}
                {categoryConfigs.map((config, index) => {
                  const Icon = config.icon;
                  return (
                    <div key={index} className="space-y-2">
                      <div
                        className={cn(
                          "flex items-center gap-2 p-3 rounded-lg border",
                          config.bgColor,
                          config.borderColor
                        )}
                      >
                        <Icon
                          className={cn("h-4 w-4 flex-shrink-0", config.color)}
                        />
                        <span
                          className={cn("text-sm font-medium", config.color)}
                        >
                          {config.label}
                        </span>
                      </div>

                      {/* Descriptive message */}
                      <div className="p-3 rounded-lg bg-muted/50 border ml-6">
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {config.message}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Button component for the toolbar
interface ContentGuardButtonProps {
  status: "safe" | "warning" | "analyzing";
  onClick: () => void;
}

export const ContentGuardButton: React.FC<ContentGuardButtonProps> = ({
  status,
  onClick,
}) => {
  const getStatusConfig = () => {
    const texts = EDITOR_TEXTS.contentGuard.buttonTitle;

    switch (status) {
      case "safe":
        return {
          icon: CheckCircle,
          color: "text-green-600",
          bgColor: "hover:bg-green-50",
          title: texts.safe,
        };
      case "warning":
        return {
          icon: AlertTriangle,
          color: "text-red-600",
          bgColor: "hover:bg-red-50",
          title: texts.warning,
        };
      case "analyzing":
        return {
          icon: Loader,
          color: "text-blue-600",
          bgColor: "hover:bg-blue-50",
          title: texts.analyzing,
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className={cn("gap-2", config.bgColor)}
      title={config.title}
    >
      <Icon
        className={cn(
          "h-4 w-4",
          config.color,
          status === "analyzing" && "animate-spin"
        )}
      />
      <span className="text-xs font-medium">
        {EDITOR_TEXTS.toolbar.contentGuard}
      </span>
    </Button>
  );
};
