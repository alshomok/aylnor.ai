"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DebugChatPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const testChatAPI = async () => {
    setLoading(true);
    setError("");
    
    try {
      console.log('=== Testing Chat API ===');
      
      const response = await fetch('/api/chat/enhanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'مرحباً' }]
        })
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      const data = await response.json();
      console.log('Response data:', data);

      setResult({
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        data
      });

    } catch (err) {
      console.error('Test error:', err);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-foreground">Chat API Debug</h1>
        
        <div className="space-y-4">
          <Button onClick={testChatAPI} disabled={loading} className="w-full">
            {loading ? 'Testing...' : 'Test Chat API'}
          </Button>
          
          {error && (
            <Card className="border-red-500">
              <CardContent className="pt-6">
                <h3 className="text-red-500 font-semibold mb-2">Error:</h3>
                <pre className="text-sm bg-red-50 p-3 rounded overflow-auto">
                  {error}
                </pre>
              </CardContent>
            </Card>
          )}
          
          {result && (
            <Card>
              <CardHeader>
                <CardTitle>API Response</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <strong>Status:</strong> {result.status} {result.statusText}
                  </div>
                  
                  <div>
                    <strong>Response Data:</strong>
                    <pre className="mt-2 p-3 bg-muted rounded text-xs overflow-auto max-h-96">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </div>
                  
                  <div>
                    <strong>Headers:</strong>
                    <pre className="mt-2 p-3 bg-muted rounded text-xs">
                      {JSON.stringify(result.headers, null, 2)}
                    </pre>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-3">Quick Checks:</h3>
              <div className="space-y-2 text-sm">
                <div>• Open browser console (F12) for detailed logs</div>
                <div>• Check Network tab for failed requests</div>
                <div>• Verify environment variables in Vercel</div>
                <div>• Try <a href="/test-keys" className="text-primary hover:underline">/test-keys</a> for key status</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
