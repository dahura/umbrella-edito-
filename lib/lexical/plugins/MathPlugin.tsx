"use client";

import { useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $wrapNodeInElement } from "@lexical/utils";
import {
  $createParagraphNode,
  $insertNodes,
  $isRootOrShadowRoot,
  COMMAND_PRIORITY_EDITOR,
  COMMAND_PRIORITY_HIGH,
  CONTROLLED_TEXT_INSERTION_COMMAND,
  createCommand,
  type LexicalCommand,
  type LexicalNode,
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  $createTextNode,
  $isParagraphNode,
  $getNodeByKey,
} from "lexical";
import { $createMathNode, MathNode, $isMathNode } from "../nodes/math-node";

type InsertCommandPayload = {
  equation: string;
  inline: boolean;
};

type EditCommandPayload = {
  nodeKey: string;
  equation: string;
  inline: boolean;
};

type EditMathModalPayload = {
  nodeKey: string;
  equation: string;
  inline: boolean;
};

export const INSERT_MATH_COMMAND: LexicalCommand<InsertCommandPayload> =
  createCommand("INSERT_MATH_COMMAND");
export const EDIT_MATH_AS_TEXT_COMMAND: LexicalCommand<EditCommandPayload> =
  createCommand("EDIT_MATH_AS_TEXT_COMMAND");
export const EDIT_MATH_MODAL_COMMAND: LexicalCommand<EditMathModalPayload> =
  createCommand("EDIT_MATH_MODAL_COMMAND");

export function MathPlugin({
  onEditMath,
}: {
  onEditMath?: (nodeKey: string, equation: string, inline: boolean) => void;
}) {
  const [editor] = useLexicalComposerContext();
  let isApplyingMath = false;

  useEffect(() => {
    if (!editor.hasNodes([MathNode])) {
      throw new Error("MathPlugin: MathNode not registered on editor");
    }

    const unregisterInline = editor.registerUpdateListener(
      ({ editorState }) => {
        if (isApplyingMath) return;

        editorState.read(() => {
          const sel = $getSelection();
          if (!$isRangeSelection(sel) || !sel.isCollapsed()) return;

          const anchor = sel.anchor.getNode();
          if (!$isTextNode(anchor)) return;

          const text = anchor.getTextContent();
          const offset = sel.anchor.offset;

          // Inline math: $...$ followed by a space (or end of line)
          const inlineRegex = /\$([^$]+?)\$\s?$/;
          const m = text.slice(0, offset).match(inlineRegex);

          if (m && m.index !== undefined && m[1] !== undefined) {
            const fullMatch = m[0];
            const matchStart = m.index;
            const equation = m[1]; // Extract only the content without $

            if (offset === matchStart + fullMatch.length) {
              isApplyingMath = true;
              editor.update(() => {
                const currentAnchor = sel.anchor.getNode();
                if (!$isTextNode(currentAnchor)) return;

                const textContent = currentAnchor.getTextContent();
                const beforeText = textContent.slice(0, matchStart);
                const afterText = textContent.slice(
                  matchStart + fullMatch.length
                );

                const mathNode = $createMathNode(equation, true); // Store without $

                currentAnchor.replace(mathNode);
                if (beforeText) {
                  mathNode.insertBefore($createTextNode(beforeText));
                }
                if (afterText) {
                  mathNode.insertAfter($createTextNode(afterText));
                }
                mathNode.selectNext();
              });
              isApplyingMath = false;
            }
          }
        });
      }
    );

    const unregisterBlockMath = editor.registerCommand(
      CONTROLLED_TEXT_INSERTION_COMMAND,
      (payload: string) => {
        if (isApplyingMath) return false;

        const selection = $getSelection();
        if (!$isRangeSelection(selection) || !selection.isCollapsed())
          return false;

        const anchorNode = selection.anchor.getNode();
        if (!$isTextNode(anchorNode)) return false;

        const textContent = anchorNode.getTextContent();
        const offset = selection.anchor.offset;

        if (payload === "$" && textContent.slice(offset - 1, offset) === "$") {
          const currentLineText = textContent.slice(0, offset + 1);

          if (currentLineText.trim() === "$$") {
            isApplyingMath = true;
            editor.update(() => {
              const currentSelection = $getSelection();
              if (!$isRangeSelection(currentSelection)) return;

              const currentAnchorNode = currentSelection.anchor.getNode();
              if (!$isTextNode(currentAnchorNode)) return;

              const currentNode: LexicalNode | null =
                currentAnchorNode.getParentOrThrow();
              const collectedLatexParts: string[] = [];
              let foundOpeningDelimiter = false;
              const nodesToReplace: LexicalNode[] = [];

              collectedLatexParts.unshift(
                currentAnchorNode
                  .getTextContent()
                  .slice(0, currentSelection.anchor.offset - 1)
              );
              nodesToReplace.unshift(currentNode);

              let tempNode = currentNode.getPreviousSibling();
              while (tempNode) {
                nodesToReplace.unshift(tempNode);
                if ($isParagraphNode(tempNode)) {
                  const paragraphText = tempNode.getTextContent();
                  if (paragraphText.trim().startsWith("$$")) {
                    foundOpeningDelimiter = true;
                    // Extract content without opening $$
                    collectedLatexParts.unshift(paragraphText.trim().slice(2));
                    break;
                  } else {
                    collectedLatexParts.unshift(paragraphText);
                  }
                }
                tempNode = tempNode.getPreviousSibling();
              }

              if (foundOpeningDelimiter) {
                const collectedLatex = collectedLatexParts.join("\n").trim();
                // Store clean LaTeX without delimiters
                const mathNode = $createMathNode(collectedLatex, false);

                const firstNodeToReplace = nodesToReplace[0];
                const parentOfFirstNode = firstNodeToReplace.getParent();

                if (parentOfFirstNode) {
                  firstNodeToReplace.insertBefore(mathNode);
                  nodesToReplace.forEach((node) => node.remove());

                  const newParagraph = $createParagraphNode();
                  mathNode.insertAfter(newParagraph);
                  newParagraph.selectStart();
                }
              }
            });
            isApplyingMath = false;
            return true;
          }
        }
        return false;
      },
      COMMAND_PRIORITY_HIGH
    );

    const unregisterInsertMath = editor.registerCommand<InsertCommandPayload>(
      INSERT_MATH_COMMAND,
      (payload) => {
        const { equation, inline } = payload;
        // Create node with clean LaTeX (no delimiters)
        const mathNode = $createMathNode(equation, inline);
        $insertNodes([mathNode]);
        if ($isRootOrShadowRoot(mathNode.getParentOrThrow())) {
          $wrapNodeInElement(mathNode, $createParagraphNode).selectEnd();
        }
        return true;
      },
      COMMAND_PRIORITY_EDITOR
    );

    const unregisterEditMathAsText = editor.registerCommand<EditCommandPayload>(
      EDIT_MATH_AS_TEXT_COMMAND,
      (payload) => {
        editor.update(() => {
          const { nodeKey, equation, inline } = payload;
          const mathNode = $getNodeByKey(nodeKey);

          if ($isMathNode(mathNode)) {
            // Add delimiters when converting to text
            const fullLatex = inline ? `$${equation}$` : `$$${equation}$$`;
            const newParagraph = $createParagraphNode();
            const textNode = $createTextNode(fullLatex);
            textNode.setFormat("code");

            newParagraph.append(textNode);
            mathNode.replace(newParagraph);
            textNode.select();
          }
        });
        return true;
      },
      COMMAND_PRIORITY_EDITOR
    );

    // New command to open the edit modal
    const unregisterEditMathModal =
      editor.registerCommand<EditMathModalPayload>(
        EDIT_MATH_MODAL_COMMAND,
        (payload) => {
          const { nodeKey, equation, inline } = payload;
          onEditMath?.(nodeKey, equation, inline);
          return true;
        },
        COMMAND_PRIORITY_EDITOR
      );

    return () => {
      unregisterInline();
      unregisterBlockMath();
      unregisterInsertMath();
      unregisterEditMathAsText();
      unregisterEditMathModal();
    };
  }, [editor, onEditMath]);

  return null;
}
