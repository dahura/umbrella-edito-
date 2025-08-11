"use client";

import type React from "react";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Bold,
  Italic,
  Underline,
  Quote,
  Undo,
  Redo,
  Eraser,
  Subscript,
  Superscript,
  FunctionSquare,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { EDITOR_TEXTS } from "@/lib/editor-texts";

// ---- PrismJS (needed for @lexical/code) ------------------------------------
// PrismJS is only used to satisfy @lexical/code peer requirement.
import Prism from "prismjs";
import "prismjs/components/prism-markup";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-css";
import "prismjs/components/prism-json";
declare global {
  interface Window {
    Prism: typeof Prism;
    markdownEditor?: {
      getMarkdown: () => string;
      loadMarkdown: (markdown: string) => void;
      getCurrentContent: () => string;
      getStats: () => { characterCount: number };
    };
  }
}

if (typeof window !== "undefined") {
  window.Prism = Prism;
}
// ---------------------------------------------------------------------------

// Lexical imports
import {
  $getRoot,
  $getSelection,
  $isRangeSelection,
  CAN_UNDO_COMMAND,
  CAN_REDO_COMMAND,
  type EditorState,
  $getNodeByKey,
  type LexicalEditor,
  $isTextNode,
  type LexicalNode,
  ElementNode,
  $createTextNode,
} from "lexical";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { $setBlocksType } from "@lexical/selection";
import { $createQuoteNode, QuoteNode } from "@lexical/rich-text";
import { CodeNode } from "@lexical/code";
import { FORMAT_TEXT_COMMAND, UNDO_COMMAND, REDO_COMMAND } from "lexical";
import {
  $convertToMarkdownString,
  $convertFromMarkdownString,
} from "@lexical/markdown";

// Custom Lexical Nodes and Plugins
import { MathNode, $isMathNode } from "@/lib/lexical/nodes/math-node";
import {
  MathPlugin,
  INSERT_MATH_COMMAND,
} from "@/lib/lexical/plugins/MathPlugin";
import { ALL_TRANSFORMERS } from "@/lib/lexical/markdown/MarkdownTransformers";
import { MathModal } from "./math-modal";
import {
  TextAnalyzerWidget,
  ContentGuardButton,
} from "../lib/lexical/feature/text-analyzer-widget";

// Configuration object for easy feature management
const EDITOR_CONFIG = {
  features: {
    bold: true,
    italic: true,
    underline: true,
    quote: true,
    codeBlock: false,
    undo: true,
    redo: true,
    characterCount: true,
    math: true,
    headings: false,
    strikethrough: true,
    clearFormatting: true,
    subscript: true,
    superscript: true,
    mathModal: true,
    markdownExport: true,
    contentGuard: true,
  },
};

interface MarkdownEditorProps {
  initialContent?: string;
  placeholder?: string;
  className?: string;
  onChange?: (content: string) => void;
  onMarkdownChange?: (markdown: string) => void;
}

// Toolbar component that uses Lexical context
function ToolbarPlugin({
  onExportMarkdown,
  content,
  contentGuardStatus,
  onContentGuardStatusChange,
  isAnalyzerOpen,
  onToggleAnalyzer,
}: {
  onExportMarkdown: () => void;
  content: string;
  contentGuardStatus: "safe" | "warning" | "analyzing";
  onContentGuardStatusChange: (
    status: "safe" | "warning" | "analyzing"
  ) => void;
  isAnalyzerOpen: boolean;
  onToggleAnalyzer: () => void;
}) {
  const [editor] = useLexicalComposerContext();
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isMathModalOpen, setIsMathModalOpen] = useState(false);

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      setIsBold(selection.hasFormat("bold"));
      setIsItalic(selection.hasFormat("italic"));
      setIsUnderline(selection.hasFormat("underline"));
    }
  }, []);

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        updateToolbar();
      });
    });
  }, [editor, updateToolbar]);

  // Listen to history stack changes so we can enable / disable buttons
  useEffect(() => {
    const unregisterUndoListener = editor.registerCommand(
      CAN_UNDO_COMMAND,
      (payload: boolean) => {
        setCanUndo(payload);
        return false;
      },
      1
    );

    const unregisterRedoListener = editor.registerCommand(
      CAN_REDO_COMMAND,
      (payload: boolean) => {
        setCanRedo(payload);
        return false;
      },
      1
    );

    return () => {
      unregisterUndoListener();
      unregisterRedoListener();
    };
  }, [editor]);

  const formatBold = () => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold");
  };

  const formatItalic = () => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic");
  };

  const formatUnderline = () => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline");
  };

  const formatQuote = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createQuoteNode());
      }
    });
  };

  const handleUndo = () => {
    editor.dispatchCommand(UNDO_COMMAND, undefined);
  };

  const handleRedo = () => {
    editor.dispatchCommand(REDO_COMMAND, undefined);
  };

  const clearFormatting = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const formats: Array<
          "bold" | "italic" | "underline" | "strikethrough" | "code"
        > = ["bold", "italic", "underline", "strikethrough", "code"];
        formats.forEach((fmt) => {
          if (selection.hasFormat(fmt)) {
            editor.dispatchCommand(FORMAT_TEXT_COMMAND, fmt);
          }
        });
      }
    });
  };

  const insertSuperscriptFormula = () => {
    editor.dispatchCommand(INSERT_MATH_COMMAND, {
      equation: "x^2",
      inline: true,
    });
  };

  const insertSubscriptFormula = () => {
    editor.dispatchCommand(INSERT_MATH_COMMAND, {
      equation: "x^2",
      inline: true,
    });
  };

  const handleMathConfirm = useCallback(
    (equation: string, inline: boolean) => {
      editor.dispatchCommand(INSERT_MATH_COMMAND, { equation, inline });
    },
    [editor]
  );

  const texts = EDITOR_TEXTS.toolbar;

  return (
    <div className="flex items-center justify-between p-4 border-b bg-muted/30">
      <div className="flex items-center gap-1">
        {/* Undo/Redo */}
        {EDITOR_CONFIG.features.undo && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleUndo}
            disabled={!canUndo}
            title={texts.undo}
          >
            <Undo className="h-4 w-4" />
          </Button>
        )}
        {EDITOR_CONFIG.features.redo && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRedo}
            disabled={!canRedo}
            title={texts.redo}
          >
            <Redo className="h-4 w-4" />
          </Button>
        )}

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Text formatting */}
        {EDITOR_CONFIG.features.bold && (
          <Button
            variant={isBold ? "default" : "ghost"}
            size="sm"
            onClick={formatBold}
            title={texts.bold}
          >
            <Bold className="h-4 w-4" />
          </Button>
        )}
        {EDITOR_CONFIG.features.italic && (
          <Button
            variant={isItalic ? "default" : "ghost"}
            size="sm"
            onClick={formatItalic}
            title={texts.italic}
          >
            <Italic className="h-4 w-4" />
          </Button>
        )}
        {EDITOR_CONFIG.features.underline && (
          <Button
            variant={isUnderline ? "default" : "ghost"}
            size="sm"
            onClick={formatUnderline}
            title={texts.underline}
          >
            <Underline className="h-4 w-4" />
          </Button>
        )}
        {EDITOR_CONFIG.features.clearFormatting && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFormatting}
            title={texts.clearFormatting}
          >
            <Eraser className="h-4 w-4" />
          </Button>
        )}

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Content formatting */}
        {EDITOR_CONFIG.features.quote && (
          <Button
            variant="ghost"
            size="sm"
            onClick={formatQuote}
            title={texts.quote}
          >
            <Quote className="h-4 w-4" />
          </Button>
        )}

        {EDITOR_CONFIG.features.math && EDITOR_CONFIG.features.superscript && (
          <Button
            variant="ghost"
            size="sm"
            onClick={insertSuperscriptFormula}
            title={texts.superscript}
          >
            <Superscript className="h-4 w-4" />
          </Button>
        )}
        {EDITOR_CONFIG.features.math && EDITOR_CONFIG.features.subscript && (
          <Button
            variant="ghost"
            size="sm"
            onClick={insertSubscriptFormula}
            title={texts.subscript}
          >
            <Subscript className="h-4 w-4" />
          </Button>
        )}

        {EDITOR_CONFIG.features.math && EDITOR_CONFIG.features.mathModal && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMathModalOpen(true)}
            title={texts.insertFormula}
          >
            <FunctionSquare className="h-4 w-4" />
          </Button>
        )}

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Export */}
        {EDITOR_CONFIG.features.markdownExport && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onExportMarkdown}
            title={texts.exportMarkdown}
          >
            <Download className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Right section with Content Guard */}
      <div className="flex items-center gap-2">
        {EDITOR_CONFIG.features.contentGuard && (
          <ContentGuardButton
            status={contentGuardStatus}
            onClick={onToggleAnalyzer}
          />
        )}
      </div>

      <MathModal
        isOpen={isMathModalOpen}
        onClose={() => setIsMathModalOpen(false)}
        onConfirm={handleMathConfirm}
      />
    </div>
  );
}

// Character count plugin
function CharacterCountPlugin({
  onStatsChange,
}: {
  onStatsChange: (stats: { characterCount: number }) => void;
}) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        let characterCount = 0;
        const root = $getRoot();

        const countCharacters = (node: LexicalNode) => {
          if ($isTextNode(node)) {
            characterCount += node.getTextContent().length;
          } else if ($isMathNode(node)) {
            characterCount += 1;
          } else if (node instanceof ElementNode) {
            const children = node.getChildren();
            for (const child of children) {
              countCharacters(child);
            }
          }
        };

        countCharacters(root);

        onStatsChange({
          characterCount,
        });
      });
    });
  }, [editor, onStatsChange]);

  return null;
}

// Markdown conversion plugin
function MarkdownPlugin({
  onMarkdownChange,
}: {
  onMarkdownChange?: (markdown: string) => void;
}) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        try {
          const markdown = $convertToMarkdownString(ALL_TRANSFORMERS);
          onMarkdownChange?.(markdown);
        } catch (error) {
          console.error("Error converting to markdown:", error);
          onMarkdownChange?.("");
        }
      });
    });
  }, [editor, onMarkdownChange]);

  return null;
}

export function MarkdownEditor({
  initialContent = "",
  placeholder = EDITOR_TEXTS.placeholder,
  className,
  onChange,
  onMarkdownChange,
}: MarkdownEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [markdownContent, setMarkdownContent] = useState("");
  const [stats, setStats] = useState({
    characterCount: 0,
  });
  const [editingMath, setEditingMath] = useState<{
    nodeKey: string;
    equation: string;
    inline: boolean;
  } | null>(null);

  // State for Content Guard
  const [contentGuardStatus, setContentGuardStatus] = useState<
    "safe" | "warning" | "analyzing"
  >("safe");
  const [isAnalyzerOpen, setIsAnalyzerOpen] = useState(false);

  const editorRef = useRef<LexicalEditor | null>(null);

  // Lexical editor configuration
  const initialConfig = {
    namespace: "MarkdownEditor",
    theme: {
      root: "ContentEditable__root",
      placeholder: "LexicalEditorTheme__placeholder",
      text: {
        bold: "LexicalEditorTheme__textBold",
        italic: "LexicalEditorTheme__textItalic",
        underline: "LexicalEditorTheme__textUnderline",
      },
      quote: "LexicalEditorTheme__quote",
      code: "LexicalEditorTheme__code",
      mathBlock: "LexicalEditorTheme__mathBlock",
      mathInline: "LexicalEditorTheme__mathInline",
    },
    nodes: [QuoteNode, CodeNode, MathNode],
    onError: (error: Error) => {
      console.error("Lexical error:", error);
    },
    editorState: initialContent
      ? () => {
          try {
            $convertFromMarkdownString(initialContent, ALL_TRANSFORMERS);
          } catch (error) {
            console.error("Error parsing initial markdown:", error);
          }
        }
      : undefined,
  };

  const handleEditorChange = useCallback(
    (editorState: EditorState) => {
      editorState.read(() => {
        const root = $getRoot();
        const textContent = root.getTextContent();
        setContent(textContent);
        onChange?.(textContent);
      });
    },
    [onChange]
  );

  const handleStatsChange = useCallback((newStats: typeof stats) => {
    setStats(newStats);
  }, []);

  const handleMarkdownChange = useCallback(
    (markdown: string) => {
      setMarkdownContent(markdown);
      onMarkdownChange?.(markdown);
    },
    [onMarkdownChange]
  );

  const handleEditMath = useCallback(
    (nodeKey: string, equation: string, inline: boolean) => {
      setEditingMath({ nodeKey, equation, inline });
    },
    []
  );

  // Handle Content Guard status change
  const handleContentGuardStatusChange = useCallback(
    (status: "safe" | "warning" | "analyzing") => {
      setContentGuardStatus(status);

      // Automatically open widget when problematic content is detected
      if (status === "warning") {
        setIsAnalyzerOpen(true);
      }
    },
    []
  );

  const handleToggleAnalyzer = useCallback(() => {
    setIsAnalyzerOpen((prev) => !prev);
  }, []);

  const handleCloseAnalyzer = useCallback(() => {
    setIsAnalyzerOpen(false);
  }, []);

  // Function to get current markdown (can be called externally)
  const getMarkdown = useCallback((): string => {
    if (!editorRef.current) return "";

    let markdown = "";
    editorRef.current.getEditorState().read(() => {
      try {
        markdown = $convertToMarkdownString(ALL_TRANSFORMERS);
      } catch (error) {
        console.error("Error converting to markdown:", error);
        markdown = "";
      }
    });
    return markdown;
  }, []);

  // Function to load markdown into editor
  const loadMarkdown = useCallback((markdown: string) => {
    if (!editorRef.current) return;

    editorRef.current.update(() => {
      try {
        const root = $getRoot();
        root.clear();
        $convertFromMarkdownString(markdown, ALL_TRANSFORMERS);
      } catch (error) {
        console.error("Error loading markdown:", error);
      }
    });
  }, []);

  const handleExportMarkdown = useCallback(() => {
    const markdown = getMarkdown();

    // Create and download file
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "document.md";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Also log to console for development
    console.log("Exported Markdown:", markdown);
  }, [getMarkdown]);

  // Expose functions for external use
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.markdownEditor = {
        getMarkdown,
        loadMarkdown,
        getCurrentContent: () => content,
        getStats: () => stats,
      };
    }
  }, [getMarkdown, loadMarkdown, content, stats]);

  const footerTexts = EDITOR_TEXTS.footer;

  return (
    <>
      <Card
        className={cn("w-full transition-all duration-300 p-0", className, {
          "ring-4 ring-red-500 ring-opacity-70 border-red-500 shadow-red-200 shadow-lg":
            contentGuardStatus === "warning",
          "ring-2 ring-blue-500 ring-opacity-50 border-blue-300":
            contentGuardStatus === "analyzing",
        })}
      >
        <div className="relative">
          <LexicalComposer initialConfig={initialConfig}>
            <EditorRefPlugin editorRef={editorRef} />
            <ToolbarPlugin
              onExportMarkdown={handleExportMarkdown}
              content={content}
              contentGuardStatus={contentGuardStatus}
              onContentGuardStatusChange={handleContentGuardStatusChange}
              isAnalyzerOpen={isAnalyzerOpen}
              onToggleAnalyzer={handleToggleAnalyzer}
            />
            <div className="relative">
              <RichTextPlugin
                contentEditable={
                  <div
                    className={cn("transition-all duration-300", {
                      "bg-red-50/30": contentGuardStatus === "warning",
                      "bg-blue-50/30": contentGuardStatus === "analyzing",
                    })}
                  >
                    <ContentEditable className="ContentEditable__root min-h-[300px]" />
                  </div>
                }
                placeholder={
                  <div className="LexicalEditorTheme__placeholder">
                    {placeholder}
                  </div>
                }
                ErrorBoundary={LexicalErrorBoundary}
              />
              <OnChangePlugin onChange={handleEditorChange} />
              <HistoryPlugin />
              <CharacterCountPlugin onStatsChange={handleStatsChange} />
              <MarkdownPlugin onMarkdownChange={handleMarkdownChange} />
              {EDITOR_CONFIG.features.math && (
                <MathPlugin onEditMath={handleEditMath} />
              )}
            </div>
            <MathEditModal
              editingMath={editingMath}
              onClose={() => setEditingMath(null)}
            />
          </LexicalComposer>
        </div>

        <div
          className={cn(
            "flex justify-between items-center p-4 border-t transition-all duration-300",
            {
              "bg-red-50 border-red-200": contentGuardStatus === "warning",
              "bg-blue-50 border-blue-200": contentGuardStatus === "analyzing",
              "bg-muted/30": contentGuardStatus === "safe",
            }
          )}
        >
          <div className="flex items-center gap-4">
            {EDITOR_CONFIG.features.math && (
              <span className="flex items-center gap-1">
                {footerTexts.supportsFormulas}{" "}
                <a
                  href="https://katex.org/docs/support_table"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  {footerTexts.formulasLink}
                </a>
              </span>
            )}
          </div>
          {EDITOR_CONFIG.features.characterCount && (
            <div className="flex items-center gap-4">
              <span>
                {stats.characterCount} {footerTexts.charactersCount}
              </span>
            </div>
          )}
        </div>
      </Card>

      {/* Floating analyzer widget */}
      {EDITOR_CONFIG.features.contentGuard && (
        <TextAnalyzerWidget
          text={content}
          isOpen={isAnalyzerOpen}
          onClose={handleCloseAnalyzer}
          onStatusChange={handleContentGuardStatusChange}
        />
      )}
    </>
  );
}

// Plugin to get editor reference
function EditorRefPlugin({
  editorRef,
}: {
  editorRef: React.MutableRefObject<LexicalEditor | null>;
}) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    editorRef.current = editor;
    return () => {
      editorRef.current = null;
    };
  }, [editor, editorRef]);

  return null;
}

// Component for editing existing formulas
function MathEditModal({
  editingMath,
  onClose,
}: {
  editingMath: { nodeKey: string; equation: string; inline: boolean } | null;
  onClose: () => void;
}) {
  const [editor] = useLexicalComposerContext();

  const handleConfirm = useCallback(
    (equation: string, inline: boolean) => {
      if (!editingMath) return;

      editor.update(() => {
        const mathNode = $getNodeByKey(editingMath.nodeKey);
        if ($isMathNode(mathNode)) {
          mathNode.setEquation(equation);
        }
      });
      onClose();
    },
    [editor, editingMath, onClose]
  );

  if (!editingMath) return null;

  return (
    <MathModal
      isOpen={true}
      onClose={onClose}
      onConfirm={handleConfirm}
      initialEquation={editingMath.equation}
      initialInline={editingMath.inline}
    />
  );
}
