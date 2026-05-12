"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, AlertCircle, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AylnorLogoUnique } from "@/components/aylnor-logo-unique";

interface TestResult {
  name: string;
  status: 'success' | 'error' | 'loading' | 'pending';
  message: string;
  details?: any;
}

export default function TestConnectionPage() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isTesting, setIsTesting] = useState(false);

  const tests: TestResult[] = [
    {
      name: 'Environment Variables',
      status: 'pending',
      message: 'Checking API keys configuration...'
    },
    {
      name: 'Gemini API Key 1',
      status: 'pending',
      message: 'Testing Gemini API connection...'
    },
    {
      name: 'Gemini API Key 2',
      status: 'pending',
      message: 'Testing Gemini API connection...'
    },
    {
      name: 'Grok API Key 1',
      status: 'pending',
      message: 'Testing Grok API connection...'
    },
    {
      name: 'Grok API Key 2',
      status: 'pending',
      message: 'Testing Grok API connection...'
    },
    {
      name: 'Supabase Database',
      status: 'pending',
      message: 'Testing database connection...'
    },
    {
      name: 'Ultimate Chat API',
      status: 'pending',
      message: 'Testing complete API functionality...'
    }
  ];

  const runTests = async () => {
    setIsTesting(true);
    setTestResults(tests.map(test => ({ ...test, status: 'loading' })));

    try {
      // Test Environment Variables
      const envResponse = await fetch('/api/keys-test');
      const envData = await envResponse.json();
      
      setTestResults(prev => prev.map((test, index) => 
        index === 0 ? {
          ...test,
          status: envData.total_configured === envData.total_required ? 'success' : 'error',
          message: envData.total_configured === envData.total_required ? 
            'All environment variables configured' : 
            `Missing ${envData.total_required - envData.total_configured} variables`,
          details: envData
        } : test
      ));

      // Test Gemini Keys
      for (let i = 1; i <= 2; i++) {
        try {
          const response = await fetch('/api/chat/ultimate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              messages: [{ role: 'user', content: 'test' }],
              model: 'gemini',
              context: 'general'
            })
          });

          const data = await response.json();
          
          setTestResults(prev => prev.map((test, index) => 
            index === i ? {
              ...test,
              status: data.success ? 'success' : 'error',
              message: data.success ? 
                `Gemini Key ${i} working` : 
                `Gemini Key ${i} failed: ${data.details}`,
              details: data
            } : test
          ));
        } catch (error) {
          setTestResults(prev => prev.map((test, index) => 
            index === i ? {
              ...test,
              status: 'error',
              message: `Gemini Key ${i} connection failed`,
              details: error
            } : test
          ));
        }
      }

      // Test Grok Keys
      for (let i = 3; i <= 4; i++) {
        try {
          const response = await fetch('/api/chat/ultimate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              messages: [{ role: 'user', content: 'test' }],
              model: 'grok',
              context: 'general'
            })
          });

          const data = await response.json();
          
          setTestResults(prev => prev.map((test, index) => 
            index === i ? {
              ...test,
              status: data.success ? 'success' : 'error',
              message: data.success ? 
                `Grok Key ${i - 2} working` : 
                `Grok Key ${i - 2} failed: ${data.details}`,
              details: data
            } : test
          ));
        } catch (error) {
          setTestResults(prev => prev.map((test, index) => 
            index === i ? {
              ...test,
              status: 'error',
              message: `Grok Key ${i - 2} connection failed`,
              details: error
            } : test
          ));
        }
      }

      // Test Supabase
      try {
        const response = await fetch('/api/chat/ultimate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [{ role: 'user', content: 'test database connection' }],
            userId: 'test-user',
            sessionId: 'test-session'
          })
        });

        const data = await response.json();
        
        setTestResults(prev => prev.map((test, index) => 
          index === 5 ? {
            ...test,
            status: data.success ? 'success' : 'error',
            message: data.success ? 
              'Database connection working' : 
              `Database connection failed: ${data.details}`,
            details: data
          } : test
        ));
      } catch (error) {
        setTestResults(prev => prev.map((test, index) => 
          index === 5 ? {
            ...test,
            status: 'error',
            message: 'Database connection failed',
            details: error
          } : test
        ));
      }

      // Test Ultimate API
      try {
        const response = await fetch('/api/chat/ultimate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [{ role: 'user', content: 'اختبار شامل للبوت' }],
            context: 'general',
            model: 'auto'
          })
        });

        const data = await response.json();
        
        setTestResults(prev => prev.map((test, index) => 
          index === 6 ? {
            ...test,
            status: data.success ? 'success' : 'error',
            message: data.success ? 
              'Ultimate API working perfectly' : 
              `Ultimate API failed: ${data.details}`,
            details: data
          } : test
        ));
      } catch (error) {
        setTestResults(prev => prev.map((test, index) => 
          index === 6 ? {
            ...test,
            status: 'error',
            message: 'Ultimate API failed',
            details: error
          } : test
        ));
      }

    } catch (error) {
      console.error('Test suite error:', error);
    } finally {
      setIsTesting(false);
    }
  };

  useEffect(() => {
    runTests();
  }, []);

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'loading':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      case 'loading':
        return 'border-blue-200 bg-blue-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const successCount = testResults.filter(t => t.status === 'success').length;
  const errorCount = testResults.filter(t => t.status === 'error').length;
  const loadingCount = testResults.filter(t => t.status === 'loading').length;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <AylnorLogoUnique size="md" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">اختبار الاتصال</h1>
              <p className="text-muted-foreground">فحص مفاتيح API والاتصال بالباك إند</p>
            </div>
          </div>
          
          <Button
            onClick={runTests}
            disabled={isTesting}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isTesting ? 'animate-spin' : ''}`} />
            {isTesting ? 'جاري الاختبار...' : 'إعادة الاختبار'}
          </Button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{successCount}</div>
                <div className="text-sm text-green-600">نجاح</div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{errorCount}</div>
                <div className="text-sm text-red-600">أخطاء</div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{loadingCount}</div>
                <div className="text-sm text-blue-600">جاري الاختبار</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Test Results */}
        <div className="space-y-4">
          {testResults.map((test, index) => (
            <Card key={index} className={`border-l-4 ${getStatusColor(test.status)}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  {getStatusIcon(test.status)}
                  <span className="text-lg">{test.name}</span>
                  <span className={`text-sm px-2 py-1 rounded ${
                    test.status === 'success' ? 'bg-green-100 text-green-800' :
                    test.status === 'error' ? 'bg-red-100 text-red-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {test.status === 'success' ? 'نجح' :
                     test.status === 'error' ? 'فشل' :
                     test.status === 'loading' ? 'جاري' : 'في الانتظار'}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground mb-2">{test.message}</p>
                
                {test.details && (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                      عرض التفاصيل
                    </summary>
                    <pre className="mt-2 p-3 bg-muted rounded text-xs overflow-auto max-h-32">
                      {JSON.stringify(test.details, null, 2)}
                    </pre>
                  </details>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>روابط سريعة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <a href="/admin" className="block text-primary hover:underline">
                → صفحة الإدارة
              </a>
              <a href="/chat" className="block text-primary hover:underline">
                → صفحة الدردشة
              </a>
              <a href="/diagnose" className="block text-primary hover:underline">
                → صفحة التشخيص
              </a>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>البيئة المطلوبة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div><strong>Environment Variables:</strong></div>
                <div>NEXT_PUBLIC_SUPABASE_URL</div>
                <div>SUPABASE_SERVICE_ROLE_KEY</div>
                <div>GEMINI_API_KEY_1</div>
                <div>GEMINI_API_KEY_2</div>
                <div>GROK_API_KEY_1</div>
                <div>GROK_API_KEY_2</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
