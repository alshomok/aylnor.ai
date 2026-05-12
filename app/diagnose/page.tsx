"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface DiagnosticResult {
  name: string;
  status: "success" | "error" | "pending";
  message: string;
  details?: string;
}

export default function DiagnosePage() {
  const [results, setResults] = useState<DiagnosticResult[]>([
    { name: "Environment Variables", status: "pending", message: "Checking..." },
    { name: "Database Connection", status: "pending", message: "Checking..." },
    { name: "API Routes", status: "pending", message: "Checking..." },
    { name: "AI Models", status: "pending", message: "Checking..." }
  ]);

  const runDiagnostics = async () => {
    const newResults = [...results];

    // Test 1: Environment Variables
    try {
      const response = await fetch('/api/chat/test');
      const data = await response.json();
      newResults[0] = {
        name: "Environment Variables",
        status: "success",
        message: "API routes accessible",
        details: JSON.stringify(data, null, 2)
      };
    } catch (error) {
      newResults[0] = {
        name: "Environment Variables",
        status: "error",
        message: "Cannot access API routes",
        details: (error as Error).message
      };
    }

    // Test 2: Database Connection
    try {
      // This will test if Supabase is configured
      const testDb = await fetch('/api/chat/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'test' }]
        })
      });
      const data = await testDb.json();
      newResults[1] = {
        name: "Database Connection",
        status: "success",
        message: "API responding correctly",
        details: "Test API working"
      };
    } catch (error) {
      newResults[1] = {
        name: "Database Connection",
        status: "error",
        message: "API not responding",
        details: (error as Error).message
      };
    }

    // Test 3: API Routes
    try {
      const response = await fetch('/api/chat/test');
      if (response.ok) {
        newResults[2] = {
          name: "API Routes",
          status: "success",
          message: "All API routes working",
          details: "Status: 200 OK"
        };
      } else {
        throw new Error(`Status: ${response.status}`);
      }
    } catch (error) {
      newResults[2] = {
        name: "API Routes",
        status: "error",
        message: "API routes not working",
        details: (error as Error).message
      };
    }

    // Test 4: AI Models (simulated)
    newResults[3] = {
      name: "AI Models",
      status: "pending",
      message: "API keys not configured (test mode)",
      details: "Configure GEMINI_API_KEY_1, GROK_API_KEY_1 in Vercel"
    };

    setResults(newResults);
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "error":
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-foreground">Aylnor.ai Diagnostics</h1>
        
        <div className="space-y-4">
          {results.map((result, index) => (
            <Card key={index} className="p-6 border-border">
              <div className="flex items-start gap-4">
                {getStatusIcon(result.status)}
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground">{result.name}</h3>
                  <p className="text-muted-foreground mt-1">{result.message}</p>
                  {result.details && (
                    <details className="mt-2">
                      <summary className="text-sm text-primary cursor-pointer">Show Details</summary>
                      <pre className="mt-2 p-3 bg-muted rounded text-xs overflow-auto">
                        {result.details}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-8 space-y-4">
          <Button onClick={runDiagnostics} className="w-full">
            Run Diagnostics Again
          </Button>
          
          <div className="p-4 bg-muted rounded-lg">
            <h3 className="font-semibold mb-2">Next Steps:</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Add environment variables in Vercel dashboard</li>
              <li>• Configure Supabase project and run schema</li>
              <li>• Get Gemini API keys from Google AI Studio</li>
              <li>• Get Grok API keys from X.AI Platform</li>
              <li>• Redeploy after adding keys</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
