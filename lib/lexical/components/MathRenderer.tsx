"use client";

import type * as React from "react";
import ReactKatex from "react-katex";
import { BlockMath, InlineMath } from "react-katex";
import "katex/dist/katex.min.css";
import { EDITOR_TEXTS } from "@/lib/editor-texts";

interface MathRendererProps {
  equation: string;
  inline: boolean;
}

const MathRenderer: React.FC<MathRendererProps> = ({ equation, inline }) => {
  const cleanEquation = equation.trim();

  try {
    return inline ? (
      <InlineMath math={cleanEquation} />
    ) : (
      <BlockMath math={cleanEquation} />
    );
  } catch (error) {
    return (
      <span className="text-red-500 bg-red-50 px-2 py-1 rounded text-sm">
        {EDITOR_TEXTS.errors.formulaError} {cleanEquation}
      </span>
    );
  }
};

export default MathRenderer;
