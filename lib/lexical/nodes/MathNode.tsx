"use client";

import type React from "react";

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {
  DOMConversionMap,
  DOMExportOutput,
  EditorConfig,
  LexicalEditor,
  NodeKey,
} from "lexical";

import {
  $applyNodeReplacement,
  EditorThemeClasses,
  LexicalNode,
} from "lexical";
import { Suspense } from "react";

import { EDIT_MATH_AS_TEXT_COMMAND } from "../commands/InsertMathCommand";

export type MathNodeType = {
  equation: string;
  inline: boolean;
};

export function importMathJax() {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    return import(/* webpackIgnore: true */ "mathjax")
      .then((MathJax) => {
        window.MathJax = MathJax;
        return MathJax;
      })
      .catch(() => {
        console.warn(
          "Failed to load MathJax dynamically. Ensure it is included in your project."
        );
        return null;
      });
  } catch (e) {
    console.warn(
      "Failed to load MathJax dynamically. Ensure it is included in your project."
    );
    return null;
  }
}

let MathRenderer: React.ComponentType<{ equation: string; inline: boolean }>;

if (typeof window !== "undefined") {
  MathRenderer = require("../ui/MathRenderer").MathRenderer;
}

export class MathNode extends LexicalNode {
  __equation: string;
  __inline: boolean;

  constructor(equation: string, inline: boolean, key?: NodeKey) {
    super(key);
    this.__equation = equation;
    this.__inline = inline;
  }

  static getType(): string {
    return "math";
  }

  static clone(node: MathNode): MathNode {
    return new MathNode(node.__equation, node.__inline, node.__key);
  }

  createDOM(config: EditorConfig, editor: LexicalEditor): HTMLElement {
    const dom = document.createElement("span");
    dom.classList.add(config.theme[EditorThemeClasses.Math]);
    return dom;
  }

  updateDOM(
    prevNode: MathNode,
    dom: HTMLElement,
    config: EditorConfig,
    editor: LexicalEditor
  ): boolean {
    return false;
  }

  static importDOM(): DOMConversionMap | null {
    return null;
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement("math");
    element.setAttribute("data-lexical-math", this.__equation);
    return { element };
  }

  exportJSON(): MathNodeType {
    return {
      equation: this.getEquation(),
      inline: this.isInline(),
      type: "math",
      version: 1,
    };
  }

  static importJSON(serializedNode: MathNodeType): MathNode {
    const node = $createMathNode(
      serializedNode.equation,
      serializedNode.inline
    );
    return node;
  }

  isInline(): boolean {
    return this.getData().__inline;
  }

  getEquation(): string {
    return this.getData().__equation;
  }

  decorate(editor: LexicalEditor): JSX.Element {
    const handleDblClick = () => {
      editor.dispatchCommand(EDIT_MATH_AS_TEXT_COMMAND, {
        nodeKey: this.getKey(),
        equation: this.__equation,
        inline: this.__inline,
      });
    };

    return (
      <Suspense fallback={<div>{"Loading formula…"}</div>}>
        <div onDoubleClick={handleDblClick} style={{ cursor: "pointer" }}>
          <MathRenderer equation={this.__equation} inline={this.__inline} />
        </div>
      </Suspense>
    );
  }
}

export function $createMathNode(equation: string, inline: boolean): MathNode {
  return $applyNodeReplacement(new MathNode(equation, inline));
}

export function $isMathNode(node: LexicalNode | null | undefined): boolean {
  return node instanceof MathNode;
}
