"use client";

import type * as React from "react";
import { useState, useEffect, useRef, useCallback } from "react";
import type { NodeKey, LexicalEditor } from "lexical";
import { $getNodeByKey } from "lexical";
import { $isMathNode } from "../nodes/math-node";

interface MathEditorProps {
  equation: string;
  inline: boolean;
  nodeKey: NodeKey;
  editor: LexicalEditor;
}

const MathEditor: React.FC<MathEditorProps> = ({
  equation,
  inline,
  nodeKey,
  editor,
}) => {
  const [value, setValue] = useState(equation);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    setValue(equation);
  }, [equation]);

  useEffect(() => {
    // Focus the input when editing starts
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, []);

  const handleSave = useCallback(() => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if (node && $isMathNode(node)) {
        node.setEquation(value.trim());
      }
    });
  }, [editor, nodeKey, value]);

  const handleCancel = useCallback(() => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if (node && $isMathNode(node)) {
        // No-op: inline edit mode is not used
      }
    });
  }, [editor, nodeKey]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSave();
      } else if (e.key === "Escape") {
        e.preventDefault();
        handleCancel();
      }
    },
    [handleSave, handleCancel]
  );

  const handleBlur = useCallback(() => {
    handleSave(); // Save on blur
  }, [handleSave]);

  const commonProps = {
    value,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setValue(e.target.value),
    onKeyDown: handleKeyDown,
    onBlur: handleBlur,
    className: "math-editor-input",
    style: {
      fontFamily: "monospace",
      fontSize: "14px",
      border: "1px solid #ccc",
      borderRadius: "4px",
      padding: "4px 8px",
      outline: "none",
      backgroundColor: "#f9f9f9",
    },
  };

  // Note: Inline editing is no longer used; fallback to simple textarea.
  return (
    <textarea
      ref={inputRef as React.RefObject<HTMLTextAreaElement>}
      rows={3}
      {...commonProps}
      style={{
        ...commonProps.style,
        display: "block",
        width: "100%",
        minWidth: "200px",
        resize: "vertical",
      }}
    />
  );
};

export default MathEditor;
