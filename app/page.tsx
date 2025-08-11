"use client";

import { useState } from "react";
import { MarkdownEditor } from "@/components/markdown-editor";
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
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-6xl">
        <MarkdownEditor
          initialContent=""
          placeholder="Start writing..."
          onChange={setContent}
          onMarkdownChange={setMarkdownContent}
        />
      </div>
    </div>
  );
}
