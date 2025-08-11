"use client";

import type * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { EDITOR_TEXTS } from "@/lib/editor-texts";
import { TEST_EXAMPLES, type TestExampleKey } from "@/lib/test-examples";

interface TestExamplesPanelProps {
  onLoadExample: (exampleText: string) => void;
  className?: string;
}

export const TestExamplesPanel: React.FC<TestExamplesPanelProps> = ({
  onLoadExample,
  className,
}) => {
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">
            {EDITOR_TEXTS.analysis.examples.title}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          {EDITOR_TEXTS.analysis.examples.description}
        </p>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(TEST_EXAMPLES).map(([key, exampleText]) => {
            const exampleKey = key as TestExampleKey;
            const exampleLabel = EDITOR_TEXTS.analysis.examples[exampleKey];
            return (
              <Button
                key={key}
                variant="outline"
                size="sm"
                className="text-xs h-auto p-2 text-left"
                onClick={() => onLoadExample(exampleText)}
              >
                {exampleLabel}
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
