import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getSubdomain } from '@/lib/subdomain';


export function NotificationDebugPanel() {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [serviceWorkerTest, setServiceWorkerTest] = useState<any>({});
  const [tokenInfo, setTokenInfo] = useState<any>({});

  const subdomain = getSubdomain();
  const isTrader = !subdomain || subdomain === 'www';

  useEffect(() => {
    const gatherDebugInfo = async () => {
      const info: any = {
        // Environment info
        currentURL: window.location.href,
        hostname: window.location.hostname,
        protocol: window.location.protocol,
        pathname: window.location.pathname,
        subdomain: subdomain,
        isTrader: isTrader,
        
        // Browser support
        serviceWorkerSupported: 'serviceWorker' in navigator,
        pushManagerSupported: 'PushManager' in window,
        notificationSupported: 'Notification' in window,
        
        // Current permissions
        notificationPermission: Notification.permission,
        
        // Token info
        traderToken: !!localStorage.getItem('token'),
        userToken: !!localStorage.getItem(`userToken_${subdomain}`),
        
        // Service worker info
        serviceWorkerRegistrations: 0,
        activeServiceWorker: null,
      };

      // Check service worker registrations
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        info.serviceWorkerRegistrations = registrations.length;
        info.registrationDetails = registrations.map(reg => ({
          scope: reg.scope,
          state: reg.active?.state,
          scriptURL: reg.active?.scriptURL
        }));

        // Check for registration at current scope
        const currentRegistration = await navigator.serviceWorker.getRegistration('/');
        info.currentScopeRegistration = !!currentRegistration;
        if (currentRegistration) {
          info.currentRegistrationScope = currentRegistration.scope;
          info.currentRegistrationState = currentRegistration.active?.state;
        }
      } catch (error) {
        info.serviceWorkerError = error.message;
      }

      // Storage quota (incognito detection)
      try {
        if ('storage' in navigator && 'estimate' in navigator.storage) {
          const estimate = await navigator.storage.estimate();
          info.storageQuota = estimate.quota;
          info.storageUsage = estimate.usage;
          info.possibleIncognito = estimate.quota && estimate.quota < 120000000;
        }
      } catch (error) {
        info.storageError = error.message;
      }

      // Test localStorage
      try {
        const testKey = '__notification_test__';
        localStorage.setItem(testKey, 'test');
        localStorage.removeItem(testKey);
        info.localStorageWorking = true;
      } catch (error) {
        info.localStorageWorking = false;
        info.localStorageError = error.message;
      }

      setDebugInfo(info);
    };

    gatherDebugInfo();
  }, [subdomain, isTrader]);

  const testServiceWorkerRegistration = async () => {
    setServiceWorkerTest({ testing: true });
    
    try {
      console.log('Testing service worker registration...');
      
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none'
      });
      
      console.log('Service worker registered:', registration);
      
      const result = {
        success: true,
        scope: registration.scope,
        state: registration.active?.state || 'installing',
        scriptURL: registration.active?.scriptURL || 'pending'
      };
      
      setServiceWorkerTest(result);
      
      // Update debug info
      const updatedInfo = { ...debugInfo };
      updatedInfo.serviceWorkerRegistrations += 1;
      updatedInfo.currentScopeRegistration = true;
      setDebugInfo(updatedInfo);
      
    } catch (error) {
      console.error('Service worker registration failed:', error);
      setServiceWorkerTest({
        success: false,
        error: error.message
      });
    }
  };

  const testNotificationPermission = async () => {
    try {
      console.log('Testing notification permission...');
      const permission = await Notification.requestPermission();
      console.log('Permission result:', permission);
      
      if (permission === 'granted') {
        // Test basic notification
        new Notification('Test Notification', {
          body: 'This is a test from the debug panel',
          icon: '/favicon.ico'
        });
      }
      
      // Update debug info
      setDebugInfo(prev => ({
        ...prev,
        notificationPermission: permission
      }));
      
    } catch (error) {
      console.error('Notification test failed:', error);
    }
  };

  const checkTokens = () => {
    const tokens = {
      traderToken: localStorage.getItem('token'),
      userToken: localStorage.getItem(`userToken_${subdomain}`),
      allTokens: {},
    };
    
    // Check all localStorage items for tokens
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('token') || key.includes('Token'))) {
        tokens.allTokens[key] = !!localStorage.getItem(key);
      }
    }
    
    setTokenInfo(tokens);
  };

  useEffect(() => {
    checkTokens();
  }, [subdomain]);

  const getEnvironmentAlerts = () => {
    const alerts = [];
    
    if (debugInfo.possibleIncognito) {
      alerts.push({
        type: 'error',
        message: 'You appear to be in incognito/private mode. Notifications may not work properly.'
      });
    }
    
    if (debugInfo.protocol !== 'https:' && debugInfo.hostname !== 'localhost') {
      alerts.push({
        type: 'error',
        message: 'HTTPS is required for push notifications (except on localhost).'
      });
    }
    
    if (!debugInfo.serviceWorkerSupported) {
      alerts.push({
        type: 'error',
        message: 'Service Workers are not supported in this browser.'
      });
    }
    
    if (!debugInfo.currentScopeRegistration) {
      alerts.push({
        type: 'warning',
        message: 'No service worker registered for current scope. This might be the issue!'
      });
    }
    
    if (isTrader && !tokenInfo.traderToken) {
      alerts.push({
        type: 'warning',
        message: 'No trader token found in localStorage.'
      });
    }
    
    if (!isTrader && !tokenInfo.userToken) {
      alerts.push({
        type: 'warning',
        message: `No user token found for subdomain: ${subdomain}`
      });
    }
    
    return alerts;
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Notification Debug Panel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {getEnvironmentAlerts().map((alert, index) => (
              <Alert key={index} variant={alert.type === 'error' ? 'destructive' : 'default'}>
                <AlertDescription>{alert.message}</AlertDescription>
              </Alert>
            ))}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="environment" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="environment">Environment</TabsTrigger>
          <TabsTrigger value="serviceworker">Service Worker</TabsTrigger>
          <TabsTrigger value="tokens">Tokens</TabsTrigger>
          <TabsTrigger value="tests">Tests</TabsTrigger>
        </TabsList>

        <TabsContent value="environment">
          <Card>
            <CardHeader>
              <CardTitle>Environment Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Current URL:</strong> {debugInfo.currentURL}
                </div>
                <div>
                  <strong>Hostname:</strong> {debugInfo.hostname}
                </div>
                <div>
                  <strong>Protocol:</strong> 
                  <Badge variant={debugInfo.protocol === 'https:' ? 'default' : 'destructive'} className="ml-2">
                    {debugInfo.protocol}
                  </Badge>
                </div>
                <div>
                  <strong>Subdomain:</strong> {debugInfo.subdomain || 'none'}
                </div>
                <div>
                  <strong>Is Trader:</strong> 
                  <Badge variant={debugInfo.isTrader ? 'default' : 'secondary'} className="ml-2">
                    {debugInfo.isTrader ? 'Yes' : 'No'}
                  </Badge>
                </div>
                <div>
                  <strong>Notification Permission:</strong>
                  <Badge 
                    variant={
                      debugInfo.notificationPermission === 'granted' ? 'default' :
                      debugInfo.notificationPermission === 'denied' ? 'destructive' : 'secondary'
                    } 
                    className="ml-2"
                  >
                    {debugInfo.notificationPermission}
                  </Badge>
                </div>
                <div>
                  <strong>Storage Quota:</strong> {debugInfo.storageQuota ? `${Math.round(debugInfo.storageQuota / 1024 / 1024)}MB` : 'Unknown'}
                </div>
                <div>
                  <strong>Possible Incognito:</strong>
                  <Badge variant={debugInfo.possibleIncognito ? 'destructive' : 'default'} className="ml-2">
                    {debugInfo.possibleIncognito ? 'Yes' : 'No'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="serviceworker">
          <Card>
            <CardHeader>
              <CardTitle>Service Worker Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Supported:</strong>
                  <Badge variant={debugInfo.serviceWorkerSupported ? 'default' : 'destructive'} className="ml-2">
                    {debugInfo.serviceWorkerSupported ? 'Yes' : 'No'}
                  </Badge>
                </div>
                <div>
                  <strong>Total Registrations:</strong> {debugInfo.serviceWorkerRegistrations}
                </div>
                <div>
                  <strong>Current Scope Registration:</strong>
                  <Badge variant={debugInfo.currentScopeRegistration ? 'default' : 'destructive'} className="ml-2">
                    {debugInfo.currentScopeRegistration ? 'Yes' : 'No'}
                  </Badge>
                </div>
                <div>
                  <strong>Registration State:</strong> {debugInfo.currentRegistrationState || 'None'}
                </div>
              </div>

              {debugInfo.registrationDetails && (
                <div>
                  <strong>All Registrations:</strong>
                  <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                    {JSON.stringify(debugInfo.registrationDetails, null, 2)}
                  </pre>
                </div>
              )}

              <div className="space-y-2">
                <Button onClick={testServiceWorkerRegistration} size="sm">
                  Test Service Worker Registration
                </Button>
                
                {serviceWorkerTest.testing && (
                  <p className="text-sm text-blue-600">Testing...</p>
                )}
                
                {serviceWorkerTest.success !== undefined && (
                  <Alert variant={serviceWorkerTest.success ? 'default' : 'destructive'}>
                    <AlertDescription>
                      {serviceWorkerTest.success 
                        ? `Service worker registered successfully! Scope: ${serviceWorkerTest.scope}`
                        : `Service worker registration failed: ${serviceWorkerTest.error}`
                      }
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tokens">
          <Card>
            <CardHeader>
              <CardTitle>Authentication Tokens</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Trader Token:</strong>
                  <Badge variant={tokenInfo.traderToken ? 'default' : 'destructive'} className="ml-2">
                    {tokenInfo.traderToken ? 'Present' : 'Missing'}
                  </Badge>
                </div>
                <div>
                  <strong>User Token ({subdomain}):</strong>
                  <Badge variant={tokenInfo.userToken ? 'default' : 'destructive'} className="ml-2">
                    {tokenInfo.userToken ? 'Present' : 'Missing'}
                  </Badge>
                </div>
              </div>

              {tokenInfo.allTokens && Object.keys(tokenInfo.allTokens).length > 0 && (
                <div>
                  <strong>All Token-like Items in localStorage:</strong>
                  <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                    {JSON.stringify(tokenInfo.allTokens, null, 2)}
                  </pre>
                </div>
              )}

              <Button onClick={checkTokens} size="sm">
                Refresh Token Info
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tests">
          <Card>
            <CardHeader>
              <CardTitle>Manual Tests</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Button onClick={testNotificationPermission} size="sm">
                  Test Notification Permission
                </Button>
                <Button onClick={testServiceWorkerRegistration} size="sm">
                  Register Service Worker
                </Button>
                <Button 
                  onClick={() => {
                    navigator.serviceWorker.getRegistrations().then(registrations => {
                      console.log('All service worker registrations:', registrations);
                      registrations.forEach(registration => {
                        console.log('Registration scope:', registration.scope);
                        console.log('Registration state:', registration.active?.state);
                      });
                    });
                  }} 
                  size="sm"
                >
                  Log All Registrations
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <details className="mt-4">
        <summary className="cursor-pointer font-semibold">Raw Debug Data</summary>
        <pre className="mt-2 p-4 bg-gray-100 rounded text-xs overflow-auto">
          {JSON.stringify({ debugInfo, serviceWorkerTest, tokenInfo }, null, 2)}
        </pre>
      </details>
    </div>
  );
}