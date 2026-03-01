"use client";

import { useState } from "react";
import { Sparkles, Loader2, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";

interface AIAnalysisCardProps {
  title: string;
  description: string;
  endpoint: string;
}

export function AIAnalysisCard({
  title,
  description,
  endpoint,
}: AIAnalysisCardProps) {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cached, setCached] = useState(false);

  const runAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(endpoint, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Analysis failed");
        return;
      }
      setAnalysis(data.analysis);
      setCached(!!data.cached);
    } catch {
      setError("Failed to connect to AI service");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-500" />
          <CardTitle className="text-base">{title}</CardTitle>
        </div>
        <Button
          onClick={runAnalysis}
          disabled={loading}
          variant={analysis ? "outline" : "default"}
          size="sm"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : analysis ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Re-analyze
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Run Analysis
            </>
          )}
        </Button>
      </CardHeader>
      <CardContent>
        {!analysis && !loading && !error && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
        {error && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}
        {cached && (
          <p className="mb-2 text-xs text-muted-foreground">
            Showing cached result. Click re-analyze for fresh data.
          </p>
        )}
        {analysis && (
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <ReactMarkdown>{analysis}</ReactMarkdown>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
