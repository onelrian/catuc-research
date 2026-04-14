"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCcw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
      <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mb-6">
        <AlertCircle className="w-10 h-10" />
      </div>
      <h1 className="text-3xl font-serif font-bold text-foreground mb-4">Something went wrong</h1>
      <p className="text-muted-foreground text-lg max-w-md mb-8">
        An unexpected error occurred while processing your request. Our research team has been notified.
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <Button onClick={() => reset()} className="rounded-full px-8 gap-2">
          <RefreshCcw className="w-4 h-4" /> Try Again
        </Button>
        <Button variant="outline" onClick={() => window.location.href = "/"} className="rounded-full px-8">
          Return Home
        </Button>
      </div>
    </div>
  );
}
