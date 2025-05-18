// src/components/NetworkDiagnostics.tsx

import React, { useState, useEffect } from 'react';
import { AlertTriangle, Check, Loader2, Server, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';

interface TestResult {
  url: string;
  success: boolean;
  error?: string;
  data?: any;
  time?: number;
}

const NetworkDiagnostics = () => {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [networkInfo, setNetworkInfo] = useState<any>({});

  // Get network information
  useEffect(() => {
    // Get browser info
    const navigator_info = window.navigator;
    const screen_info = window.screen;
    
    setNetworkInfo({
      userAgent: navigator_info.userAgent,
      platform: navigator_info.platform,
      language: navigator_info.language,
      cookieEnabled: navigator_info.cookieEnabled,
      screenWidth: screen_info.width,
      screenHeight: screen_info.height,
      currentURL: window.location.href,
      hostname: window.location.hostname,
      protocol: window.location.protocol
    });
  }, []);

  const runTests = async () => {
    setTesting(true);
    setResults([]);
    setSuggestion(null);
    
    // URLs to test
    const urls = [
      'http://localhost:5000/api/health',
      'http://127.0.0.1:5000/api/health',
      'https://api.themahadeva.live',
      'http://127.0.0.1:5000/api/products',
      'http://localhost:3000/api/health',
      'http://localhost:8080/api/health',
      `http://${window.location.hostname}:5000/api/health`,
      `http://${window.location.hostname}:5000/api/products`
    ];
    
    let testResults: TestResult[] = [];
    let anySuccess = false;
    
    for (const url of urls) {
      try {
        const startTime = Date.now();
        console.log(`Testing connection to ${url}...`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
        
        const response = await fetch(url, { 
          signal: controller.signal,
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        
        clearTimeout(timeoutId);
        
        const endTime = Date.now();
        const timeElapsed = endTime - startTime;
        
        if (response.ok) {
          let data;
          try {
            data = await response.json();
          } catch (e) {
            data = { text: await response.text() };
          }
          
          testResults.push({ 
            url, 
            success: true, 
            data,
            time: timeElapsed
          });
          
          anySuccess = true;
          console.log(`Success: ${url} responded in ${timeElapsed}ms`, data);
        } else {
          testResults.push({ 
            url, 
            success: false, 
            error: `HTTP ${response.status}: ${response.statusText}`,
            time: timeElapsed
          });
          console.error(`Failed: ${url} responded with status ${response.status}`);
        }
      } catch (err) {
        testResults.push({ 
          url, 
          success: false, 
          error: err.name === 'AbortError' ? 'Request timeout (5s)' : err.message
        });
        console.error(`Error testing ${url}:`, err);
      }
    }
    
    setResults(testResults);
    
    // Generate suggestion based on results
    if (!anySuccess) {
      // Check if it's a CORS issue
      if (testResults.some(r => r.error?.includes('CORS'))) {
        setSuggestion("CORS issue detected. Your server needs to enable CORS to allow requests from this origin.");
      } else if (testResults.some(r => r.error?.includes('Network Error') || r.error?.includes('Failed to fetch'))) {
        setSuggestion(
          "Network connection issue detected. Your server might not be running, or there's a network configuration issue. Try:\n" +
          "1. Make sure your backend server is running on port 5000\n" +
          "2. Check for firewall or antivirus blocking connections\n" +
          "3. Try running server.js directly with 'node server.js'\n" +
          "4. Check if another process is using port 5000"
        );
      } else {
        setSuggestion("All connection attempts failed. Your backend server might not be running or is not accessible.");
      }
    } else if (testResults.some(r => r.url.includes('/products') && r.success)) {
      setSuggestion("Product API endpoint is working! If you're still seeing 'No products found', check if your database has products.");
    } else if (testResults.some(r => r.url.includes('/health') && r.success)) {
      setSuggestion("API health endpoint is working, but product endpoint failed. Check your routes and database connection.");
    }
    
    setTesting(false);
  };

  const checkPorts = async () => {
    try {
      // Simple check if something is running on these ports
      const ports = [5000, 3000, 8080];
      const hostname = window.location.hostname === 'localhost' ? '127.0.0.1' : window.location.hostname;
      
      for (const port of ports) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2000);
          
          await fetch(`http://${hostname}:${port}`, { 
            signal: controller.signal,
            method: 'HEAD' 
          });
          
          clearTimeout(timeoutId);
          console.log(`Port ${port} is open on ${hostname}`);
        } catch (err) {
          if (err.name === 'AbortError') {
            console.log(`Port ${port} timed out on ${hostname}`);
          } else {
            console.log(`Port ${port} is closed on ${hostname}:`, err.message);
          }
        }
      }
    } catch (err) {
      console.error('Error checking ports:', err);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Network Diagnostics</span>
          <Button variant="outline" size="sm" onClick={runTests} disabled={testing}>
            {testing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Run Tests
              </>
            )}
          </Button>
        </CardTitle>
        <CardDescription>
          Check your network connection to the backend services
        </CardDescription>
      </CardHeader>
      <CardContent>
        {results.length > 0 ? (
          <div className="space-y-4">
            <div className="rounded-md border">
              <div className="bg-muted px-4 py-2 rounded-t-md font-medium text-sm">
                Test Results
              </div>
              <div className="divide-y">
                {results.map((result, index) => (
                  <div key={index} className="px-4 py-2 flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-mono text-sm truncate">{result.url}</div>
                      {result.error && (
                        <div className="text-destructive text-xs mt-1">{result.error}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {result.time && <span className="text-xs text-muted-foreground">{result.time}ms</span>}
                      {result.success ? (
                        <Check className="h-5 w-5 text-green-500" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {suggestion && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Diagnosis</AlertTitle>
                <AlertDescription className="whitespace-pre-line">
                  {suggestion}
                </AlertDescription>
              </Alert>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Server className="mx-auto h-12 w-12 mb-4 text-muted-foreground/60" />
            <p>Click "Run Tests" to check your network connectivity</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between border-t px-6 py-4">
        <div className="text-xs text-muted-foreground">
          <strong>Browser:</strong> {networkInfo.userAgent?.split(' ')[0]}
          <br />
          <strong>Host:</strong> {networkInfo.hostname}:{window.location.port || "80"}
          <br />
          <strong>Protocol:</strong> {networkInfo.protocol}
        </div>
        <Button variant="outline" size="sm" onClick={checkPorts}>
          Check Ports
        </Button>
      </CardFooter>
    </Card>
  );
};

export default NetworkDiagnostics;