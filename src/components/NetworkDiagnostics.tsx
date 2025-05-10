// src/components/NetworkDiagnostics.jsx
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCcw, CheckCircle, XCircle } from 'lucide-react';

const NetworkDiagnostics = () => {
  const [diagnostics, setDiagnostics] = useState({
    loading: true,
    backendConnection: null,
    blinkitConnection: null,
    zeptoConnection: null,
    mongoConnection: null,
    networkInfo: null
  });
  
  const runDiagnostics = async () => {
    setDiagnostics(prev => ({ ...prev, loading: true }));
    
    // Network information
    const networkInfo = {
      hostname: window.location.hostname,
      port: window.location.port,
      protocol: window.location.protocol,
      userAgent: navigator.userAgent
    };
    
    // Test backend connection
    let backendConnection = null;
    try {
      // Try different URLs
      const urls = [
        '/api/health',
        'http://localhost:5000/api/health',
        `http://${window.location.hostname}:5000/api/health`
      ];
      
      for (const url of urls) {
        try {
          console.log(`Testing backend URL: ${url}`);
          const response = await fetch(url, { timeout: 5000 });
          if (response.ok) {
            backendConnection = {
              success: true,
              url,
              data: await response.json()
            };
            break;
          }
        } catch (err) {
          console.log(`Failed testing ${url}:`, err);
        }
      }
      
      if (!backendConnection) {
        backendConnection = {
          success: false,
          error: "Could not connect to backend on any URL"
        };
      }
    } catch (error) {
      backendConnection = { success: false, error: error.message };
    }
    
    // Test Blinkit clone connection
    let blinkitConnection = null;
    try {
      const response = await fetch('http://localhost:3001', { timeout: 5000 });
      blinkitConnection = {
        success: response.ok,
        status: response.status
      };
    } catch (error) {
      blinkitConnection = { success: false, error: error.message };
    }
    
    // Test Zepto clone connection
    let zeptoConnection = null;
    try {
      const response = await fetch('http://localhost:3002', { timeout: 5000 });
      zeptoConnection = {
        success: response.ok,
        status: response.status
      };
    } catch (error) {
      zeptoConnection = { success: false, error: error.message };
    }
    
    // Test MongoDB connection via backend
    let mongoConnection = null;
    if (backendConnection?.success) {
      try {
        const response = await fetch(`${backendConnection.url.replace('/health', '/products')}`, { timeout: 5000 });
        mongoConnection = {
          success: response.ok,
          status: response.status,
          dataReceived: response.ok ? (await response.json()).length > 0 : false
        };
      } catch (error) {
        mongoConnection = { success: false, error: error.message };
      }
    } else {
      mongoConnection = { success: false, error: "Backend connection failed" };
    }
    
    setDiagnostics({
      loading: false,
      backendConnection,
      blinkitConnection,
      zeptoConnection,
      mongoConnection,
      networkInfo
    });
  };
  
  useEffect(() => {
    runDiagnostics();
  }, []);
  
  const renderStatusIcon = (status) => {
    if (status === null) return <Loader2 className="h-4 w-4 animate-spin" />;
    if (status.success) return <CheckCircle className="h-4 w-4 text-green-500" />;
    return <XCircle className="h-4 w-4 text-red-500" />;
  };
  
  return (
    <div className="p-4 border rounded-lg bg-white">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Network Diagnostics</h3>
        <Button
          onClick={runDiagnostics}
          variant="outline"
          size="sm"
          disabled={diagnostics.loading}
        >
          {diagnostics.loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Running...
            </>
          ) : (
            <>
              <RefreshCcw className="h-4 w-4 mr-2" />
              Rerun Tests
            </>
          )}
        </Button>
      </div>
      
      <div className="space-y-4">
        {/* Network Info */}
        <div className="p-3 bg-gray-50 rounded-md">
          <h4 className="font-medium mb-2">Network Information</h4>
          {diagnostics.networkInfo ? (
            <div className="text-sm">
              <div>Hostname: {diagnostics.networkInfo.hostname}</div>
              <div>Port: {diagnostics.networkInfo.port}</div>
              <div>Protocol: {diagnostics.networkInfo.protocol}</div>
            </div>
          ) : (
            <div className="flex items-center">
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              <span>Loading network info...</span>
            </div>
          )}
        </div>
        
        {/* Connection Statuses */}
        <div className="grid gap-3">
          {/* Backend Connection */}
          <div className="p-3 bg-gray-50 rounded-md">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Backend API Connection</h4>
              {renderStatusIcon(diagnostics.backendConnection)}
            </div>
            {diagnostics.backendConnection && !diagnostics.loading && (
              <div className="mt-1 text-sm">
                {diagnostics.backendConnection.success ? (
                  <div className="text-green-600">
                    Connected to {diagnostics.backendConnection.url}
                  </div>
                ) : (
                  <div className="text-red-500">
                    Error: {diagnostics.backendConnection.error}
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* MongoDB Connection */}
          <div className="p-3 bg-gray-50 rounded-md">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">MongoDB Connection</h4>
              {renderStatusIcon(diagnostics.mongoConnection)}
            </div>
            {diagnostics.mongoConnection && !diagnostics.loading && (
              <div className="mt-1 text-sm">
                {diagnostics.mongoConnection.success ? (
                  <div className="text-green-600">
                    Connected to MongoDB
                    {diagnostics.mongoConnection.dataReceived && " (data received)"}
                  </div>
                ) : (
                  <div className="text-red-500">
                    Error: {diagnostics.mongoConnection.error}
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Platform Clones */}
          <div className="p-3 bg-gray-50 rounded-md">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">Platform Clones</h4>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center">
                <span className="mr-2">Blinkit Clone:</span>
                {renderStatusIcon(diagnostics.blinkitConnection)}
              </div>
              <div className="flex items-center">
                <span className="mr-2">Zepto Clone:</span>
                {renderStatusIcon(diagnostics.zeptoConnection)}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Recommendations */}
      {!diagnostics.loading && (
        <div className="mt-4 p-3 border border-blue-100 bg-blue-50 rounded-md">
          <h4 className="font-medium text-blue-700 mb-1">Recommendations</h4>
          <ul className="text-sm text-blue-600 space-y-1 list-disc pl-5">
            {!diagnostics.backendConnection?.success && (
              <li>Check if backend server is running on port 5000</li>
            )}
            {!diagnostics.mongoConnection?.success && (
              <li>Verify MongoDB connection string in your .env file</li>
            )}
            {(!diagnostics.blinkitConnection?.success || !diagnostics.zeptoConnection?.success) && (
              <li>Make sure platform clones are running on their respective ports</li>
            )}
            {diagnostics.networkInfo?.hostname !== 'localhost' && (
              <li>For network access, ensure all services are bound to 0.0.0.0 instead of localhost</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default NetworkDiagnostics;