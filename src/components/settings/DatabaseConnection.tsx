import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Database, CheckCircle2, XCircle, Loader2, RefreshCw, Copy, Check, Server } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const DatabaseConnection = () => {
  const { toast } = useToast();
  const [apiUrl, setApiUrl] = useState(
    localStorage.getItem('api_url') || 'http://localhost:3001/api'
  );
  const [isEnabled, setIsEnabled] = useState(
    localStorage.getItem('api_enabled') === 'true'
  );
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'connected' | 'failed'>('idle');
  const [dbStatus, setDbStatus] = useState<'idle' | 'testing' | 'connected' | 'failed'>('idle');
  const [dbInfo, setDbInfo] = useState<{ status: string; database: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const testApiConnection = async (url: string): Promise<{ success: boolean; data?: { status: string; database: string } }> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(`${url}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        return { success: false };
      }
      
      const data = await response.json();
      return { success: true, data };
    } catch {
      return { success: false };
    }
  };

  const handleTestConnection = async () => {
    setConnectionStatus('testing');
    try {
      const result = await testApiConnection(apiUrl);
      setConnectionStatus(result.success ? 'connected' : 'failed');
      toast({
        title: result.success ? 'API Connection Successful' : 'API Connection Failed',
        description: result.success 
          ? 'Successfully connected to the backend API.'
          : 'Could not connect to the backend API. Please check the URL and ensure the server is running.',
        variant: result.success ? 'default' : 'destructive',
      });
    } catch {
      setConnectionStatus('failed');
      toast({
        title: 'Connection Error',
        description: 'An error occurred while testing the API connection.',
        variant: 'destructive',
      });
    }
  };

  const handleTestDatabase = async () => {
    setDbStatus('testing');
    try {
      const result = await testApiConnection(apiUrl);
      if (result.success && result.data) {
        setDbStatus(result.data.database === 'connected' ? 'connected' : 'failed');
        setDbInfo(result.data);
        toast({
          title: result.data.database === 'connected' ? 'Database Connected' : 'Database Disconnected',
          description: result.data.database === 'connected' 
            ? 'PostgreSQL database is connected and healthy.'
            : 'Backend is running but database connection failed.',
          variant: result.data.database === 'connected' ? 'default' : 'destructive',
        });
      } else {
        setDbStatus('failed');
        setDbInfo(null);
        toast({
          title: 'Database Test Failed',
          description: 'Could not reach the backend to test database connection.',
          variant: 'destructive',
        });
      }
    } catch {
      setDbStatus('failed');
      setDbInfo(null);
      toast({
        title: 'Database Test Error',
        description: 'An error occurred while testing the database connection.',
        variant: 'destructive',
      });
    }
  };

  const handleSaveSettings = () => {
    localStorage.setItem('api_url', apiUrl);
    localStorage.setItem('api_enabled', isEnabled.toString());
    toast({
      title: 'Settings Saved',
      description: 'Database connection settings have been saved. Reload the page to apply changes.',
    });
  };

  const handleCopyMigration = async () => {
    try {
      await navigator.clipboard.writeText('See docs/database/migrations/001_initial_schema.sql');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: 'Path Copied',
        description: 'Migration file path copied to clipboard.',
      });
    } catch {
      toast({
        title: 'Copy Failed',
        description: 'Could not copy to clipboard.',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    // Auto-test on load if enabled
    if (isEnabled) {
      handleTestConnection();
      handleTestDatabase();
    }
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database Connection
          </CardTitle>
          <CardDescription>
            Configure the connection to your local PostgreSQL database through the backend API.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="api-enabled">Enable API Connection</Label>
              <p className="text-sm text-muted-foreground">
                Connect to backend API instead of using mock data
              </p>
            </div>
            <Switch
              id="api-enabled"
              checked={isEnabled}
              onCheckedChange={setIsEnabled}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="api-url">Backend API URL</Label>
            <Input
              id="api-url"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              placeholder="http://localhost:3001/api"
            />
            <p className="text-xs text-muted-foreground">
              The URL of your Node.js backend server
            </p>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <Button onClick={handleTestConnection} disabled={connectionStatus === 'testing'}>
              {connectionStatus === 'testing' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing API...
                </>
              ) : (
                <>
                  <Server className="mr-2 h-4 w-4" />
                  Test API
                </>
              )}
            </Button>
            <Button onClick={handleTestDatabase} disabled={dbStatus === 'testing'} variant="secondary">
              {dbStatus === 'testing' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing DB...
                </>
              ) : (
                <>
                  <Database className="mr-2 h-4 w-4" />
                  Test Database
                </>
              )}
            </Button>
            <Button onClick={handleSaveSettings} variant="outline">
              Save Settings
            </Button>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">API Status:</span>
              <Badge variant={
                connectionStatus === 'connected' ? 'default' :
                connectionStatus === 'failed' ? 'destructive' :
                'secondary'
              } className="flex items-center gap-1">
                {connectionStatus === 'connected' && <CheckCircle2 className="h-3 w-3" />}
                {connectionStatus === 'failed' && <XCircle className="h-3 w-3" />}
                {connectionStatus === 'idle' && 'Not Tested'}
                {connectionStatus === 'testing' && 'Testing...'}
                {connectionStatus === 'connected' && 'Connected'}
                {connectionStatus === 'failed' && 'Failed'}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Database:</span>
              <Badge variant={
                dbStatus === 'connected' ? 'default' :
                dbStatus === 'failed' ? 'destructive' :
                'secondary'
              } className="flex items-center gap-1">
                {dbStatus === 'connected' && <CheckCircle2 className="h-3 w-3" />}
                {dbStatus === 'failed' && <XCircle className="h-3 w-3" />}
                {dbStatus === 'idle' && 'Not Tested'}
                {dbStatus === 'testing' && 'Testing...'}
                {dbStatus === 'connected' && 'Connected'}
                {dbStatus === 'failed' && 'Failed'}
              </Badge>
            </div>
          </div>

          {dbInfo && (
            <Alert>
              <Database className="h-4 w-4" />
              <AlertDescription>
                <strong>Backend Status:</strong> {dbInfo.status} | <strong>Database:</strong> {dbInfo.database}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Database Setup Instructions</CardTitle>
          <CardDescription>
            Follow these steps to set up your local PostgreSQL database
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Database className="h-4 w-4" />
            <AlertDescription>
              Make sure PostgreSQL 14+ is installed and running on your server before proceeding.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div className="rounded-lg border p-4">
              <h4 className="font-medium mb-2">Step 1: Create Database and User</h4>
              <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
{`-- Connect as postgres superuser
psql -U postgres

-- Create database and user
CREATE DATABASE db_monitor;
CREATE USER db_monitor_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE db_monitor TO db_monitor_user;`}
              </pre>
            </div>

            <div className="rounded-lg border p-4">
              <h4 className="font-medium mb-2">Step 2: Run Migration Script</h4>
              <div className="flex items-center gap-2 mb-2">
                <code className="bg-muted px-2 py-1 rounded text-sm">
                  docs/database/migrations/001_initial_schema.sql
                </code>
                <Button variant="ghost" size="sm" onClick={handleCopyMigration}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
{`-- Run the migration
psql -U db_monitor_user -d db_monitor -f docs/database/migrations/001_initial_schema.sql`}
              </pre>
            </div>

            <div className="rounded-lg border p-4">
              <h4 className="font-medium mb-2">Step 3: Configure Backend</h4>
              <p className="text-sm text-muted-foreground mb-2">
                Create a <code className="bg-muted px-1 rounded">.env</code> file in the backend folder:
              </p>
              <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
{`# Server Configuration
PORT=3001
NODE_ENV=production

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=db_monitor
DB_USER=db_monitor_user
DB_PASSWORD=your_secure_password

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=24h

# CORS Configuration
CORS_ORIGIN=http://localhost:5173`}
              </pre>
            </div>

            <div className="rounded-lg border p-4">
              <h4 className="font-medium mb-2">Step 4: Start Backend Server</h4>
              <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
{`cd docs/backend
npm install
npm start`}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
