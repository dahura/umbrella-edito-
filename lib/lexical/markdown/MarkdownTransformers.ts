import { TRANSFORMERS, type Transformer } from "@lexical/markdown";
import { $isMathNode, $createMathNode } from "../nodes/math-node";

export const MATH_TRANSFORMER: Transformer = {
  export: (node) => {
    if ($isMathNode(node)) {
      const equation = node.getEquation(); // Get clean LaTeX
      const inline = node.isInline();
      // Add delimiters on export
      return inline ? `$${equation}$` : `$$${equation}$$`;
    }
    return null;
  },
  regExp: /\$\$[\s\S]+?\$\$|\$[^$]+\$/g,
  replace: (textNode, match) => {
    const fullMatch = match[0];
    const isBlock = fullMatch.startsWith("$$") && fullMatch.endsWith("$$");
    // Extract clean LaTeX without delimiters
    const equation = isBlock
      ? fullMatch.slice(2, -2).trim()
      : fullMatch.slice(1, -1).trim();

    const mathNode = $createMathNode(equation, !isBlock);
    textNode.replace(mathNode);
  },
  type: "text-match",
};

export const ALL_TRANSFORMERS: Array<Transformer> = [
  ...TRANSFORMERS,
  MATH_TRANSFORMER,
];
