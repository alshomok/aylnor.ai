"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle } from "lucide-react";

export default function TestKeysPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testKeys = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/chat/enhanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'test_keys' }]
        })
      });
      
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: (error as Error).message });
    }
    setLoading(false);
  };

  useEffect(() => {
    testKeys();
  }, []);

  const getStatusIcon = (status: string) => {
    return status.includes('✅') ? 
      <CheckCircle className="w-5 h-5 text-green-500" /> : 
      <XCircle className="w-5 h-5 text-red-500" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Testing API Keys...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-foreground">Aylnor.ai - API Keys Test</h1>
        
        {result && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Environment Variables Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {result.keys && Object.entries(result.keys).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between p-3 bg-muted rounded">
                    <span className="font-mono text-sm">{key}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{String(value)}</span>
                      {getStatusIcon(String(value))}
                    </div>
                  </div>
                ))}
                
                <div className="mt-6 p-4 bg-primary/10 rounded">
                  <div className="text-lg font-semibold">
                    {result.total_configured} / {result.total_required} Keys Configured
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {result.total_configured === result.total_required ? 
                      '✅ All keys are ready!' : 
                      '⚠️ Some keys are missing'
                    }
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          <Button onClick={testKeys} disabled={loading} className="w-full">
            Test API Keys Again
          </Button>
          
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-3">Quick Links:</h3>
              <div className="space-y-2">
                <a href="/chat" className="block text-primary hover:underline">
                  → Go to Chat
                </a>
                <a href="/diagnose" className="block text-primary hover:underline">
                  → System Diagnostics
                </a>
                <a href="/login" className="block text-primary hover:underline">
                  → Login Page
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
