"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API not available — fall back to nothing
    }
  }

  return (
    <Button type="button" size="sm" variant="outline" onClick={handleCopy} className="shrink-0">
      {copied ? "Copied!" : "Copy"}
    </Button>
  );
}
