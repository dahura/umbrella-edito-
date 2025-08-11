"use client";

import { useState, useCallback } from "react";
import { MarkdownEditor } from "@/components/markdown-editor";
import { TestExamplesPanel } from "@/components/test-examples-panel";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function Home() {
  const [content, setContent] = useState("");
  const [markdownContent, setMarkdownContent] = useState("");
  const [serverResponse, setServerResponse] = useState("");

  // Function to load example text into editor
  const handleLoadExample = useCallback((exampleText: string) => {
    // Access the editor through the global window object
    if (typeof window !== "undefined" && window.markdownEditor) {
      window.markdownEditor.loadMarkdown(exampleText);
    }
  }, []);

  // Simulate sending markdown to server
  const sendToServer = async () => {
    try {
      setServerResponse("Sending to server...");

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // In real app, you would do:
      // const response = await fetch('/api/save-document', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ markdown: markdownContent })
      // })

      setServerResponse(
        `Successfully sent to server! Size: ${markdownContent.length} characters`
      );
    } catch (error) {
      setServerResponse("Error sending to server");
    }
  };

  return (
    <div className="min-h-screen p-4">
      <div className="w-full max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Test Examples Panel */}
          <div className="lg:col-span-1">
            <TestExamplesPanel onLoadExample={handleLoadExample} />
          </div>
          
          {/* Editor */}
          <div className="lg:col-span-3">
            <MarkdownEditor
              initialContent=""
              placeholder="Start writing..."
              onChange={setContent}
              onMarkdownChange={setMarkdownContent}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
