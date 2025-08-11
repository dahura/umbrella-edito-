"use client";

import {
  DecoratorNode,
  type EditorConfig,
  type LexicalEditor,
  type NodeKey,
  type SerializedLexicalNode,
  type Spread,
} from "lexical";
import * as React from "react";
import { Suspense } from "react";
import type { JSX } from "react/jsx-runtime";
import { EDIT_MATH_MODAL_COMMAND } from "../plugins/MathPlugin";

const MathRenderer = React.lazy(() => import("../components/MathRenderer"));

export type SerializedMathNode = Spread<
  {
    equation: string;
    inline: boolean;
    type: "math";
    version: 1;
  },
  SerializedLexicalNode
>;

export class MathNode extends DecoratorNode<JSX.Element> {
  __equation: string;
  __inline: boolean;

  /* ------------------------------------------------------------------ */
  /*  Construction / cloning                                            */
  /* ------------------------------------------------------------------ */
  static getType(): string {
    return "math";
  }

  static clone(node: MathNode): MathNode {
    return new MathNode(node.__equation, node.__inline, node.__key);
  }

  constructor(equation: string, inline: boolean, key?: NodeKey) {
    super(key);
    this.__equation = equation;
    this.__inline = inline;
  }

  /* ------------------------------------------------------------------ */
  /*  DOM                                                                */
  /* ------------------------------------------------------------------ */
  createDOM(config: EditorConfig): HTMLElement {
    const element = this.__inline
      ? document.createElement("span")
      : document.createElement("div");
    const className = this.__inline
      ? config.theme.mathInline
      : config.theme.mathBlock;
    if (className) element.className = className;
    return element;
  }

  updateDOM(prev: MathNode, dom: HTMLElement, config: EditorConfig): boolean {
    if (prev.__inline !== this.__inline) return true;
    const className = this.__inline
      ? config.theme.mathInline
      : config.theme.mathBlock;
    if (className) dom.className = className;
    return false;
  }

  /* ------------------------------------------------------------------ */
  /*  Helpers                                                            */
  /* ------------------------------------------------------------------ */
  getEquation(): string {
    return this.__equation;
  }

  setEquation(equation: string): void {
    const writable = this.getWritable();
    writable.__equation = equation;
  }

  /** Compatibility helper for markdown transformer */
  getInline(): boolean {
    return this.__inline;
  }

  isInline(): boolean {
    return this.__inline;
  }

  /* ------------------------------------------------------------------ */
  /*  Serialization                                                      */
  /* ------------------------------------------------------------------ */
  static importJSON(json: SerializedMathNode): MathNode {
    return new MathNode(json.equation, json.inline);
  }

  exportJSON(): SerializedMathNode {
    return {
      equation: this.__equation,
      inline: this.__inline,
      type: "math",
      version: 1,
    };
  }

  getTextContent(): string {
    return this.__equation;
  }

  /* ------------------------------------------------------------------ */
  /*  React render                                                       */
  /* ------------------------------------------------------------------ */
  decorate(editor: LexicalEditor): JSX.Element {
    const handleDoubleClick = () => {
      // Open modal window for editing
      editor.dispatchCommand(EDIT_MATH_MODAL_COMMAND, {
        nodeKey: this.getKey(),
        equation: this.__equation,
        inline: this.__inline,
      });
    };

    return (
      <Suspense fallback={<div>{"…"}</div>}>
        <span onDoubleClick={handleDoubleClick} style={{ cursor: "pointer" }}>
          <MathRenderer equation={this.__equation} inline={this.__inline} />
        </span>
      </Suspense>
    );
  }
}

/* -------------------------------------------------------------------- */
/*  Helper API                                                          */
/* -------------------------------------------------------------------- */
export function $createMathNode(equation: string, inline: boolean): MathNode {
  return new MathNode(equation, inline);
}
export function $isMathNode(node: unknown): node is MathNode {
  return node instanceof MathNode;
}
