import { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

interface SheetData {
  name: string;
  data: Record<string, unknown>[];
  headers: string[];
}

interface ImportResult {
  sheets: SheetData[];
  fileName: string;
  importedAt: Date;
}

export function ExcelImport() {
  const [isDragging, setIsDragging] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const processExcelFile = useCallback(async (file: File) => {
    setIsProcessing(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      
      const sheets: SheetData[] = workbook.SheetNames.map((sheetName) => {
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: '' });
        const headers = jsonData.length > 0 ? Object.keys(jsonData[0]) : [];
        
        return {
          name: sheetName,
          data: jsonData,
          headers,
        };
      });

      setImportResult({
        sheets,
        fileName: file.name,
        importedAt: new Date(),
      });

      toast.success(`Successfully imported ${file.name}`, {
        description: `Found ${sheets.length} sheet(s) with ${sheets.reduce((acc, s) => acc + s.data.length, 0)} total rows`,
      });
    } catch (error) {
      console.error('Error processing Excel file:', error);
      toast.error('Failed to process Excel file', {
        description: 'Please ensure the file is a valid Excel document',
      });
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        processExcelFile(file);
      } else {
        toast.error('Invalid file type', {
          description: 'Please upload an Excel file (.xlsx or .xls)',
        });
      }
    }
  }, [processExcelFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processExcelFile(files[0]);
    }
  }, [processExcelFile]);

  const clearImport = () => {
    setImportResult(null);
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Excel Import
          </CardTitle>
          <CardDescription>
            Upload an Excel file to import database check data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`
              relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200
              ${isDragging 
                ? 'border-primary bg-primary/10' 
                : 'border-border/50 hover:border-primary/50 hover:bg-muted/30'
              }
            `}
          >
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileSelect}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={isProcessing}
            />
            
            <div className="flex flex-col items-center gap-4">
              <div className={`p-4 rounded-full ${isDragging ? 'bg-primary/20' : 'bg-muted'}`}>
                <Upload className={`h-8 w-8 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
              </div>
              <div>
                <p className="text-foreground font-medium">
                  {isProcessing ? 'Processing...' : 'Drop your Excel file here'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  or click to browse (.xlsx, .xls)
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Import Result */}
      {importResult && (
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-success" />
              <div>
                <CardTitle className="text-lg">{importResult.fileName}</CardTitle>
                <CardDescription>
                  Imported at {importResult.importedAt.toLocaleTimeString()} • {importResult.sheets.length} sheet(s)
                </CardDescription>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={clearImport}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={importResult.sheets[0]?.name} className="w-full">
              <TabsList className="w-full justify-start overflow-x-auto">
                {importResult.sheets.map((sheet) => (
                  <TabsTrigger key={sheet.name} value={sheet.name} className="flex items-center gap-2">
                    {sheet.name}
                    <Badge variant="secondary" className="text-xs">
                      {sheet.data.length}
                    </Badge>
                  </TabsTrigger>
                ))}
              </TabsList>
              
              {importResult.sheets.map((sheet) => (
                <TabsContent key={sheet.name} value={sheet.name} className="mt-4">
                  {sheet.data.length === 0 ? (
                    <div className="flex items-center justify-center py-8 text-muted-foreground">
                      <AlertCircle className="h-4 w-4 mr-2" />
                      No data found in this sheet
                    </div>
                  ) : (
                    <div className="rounded-md border border-border/50 overflow-hidden">
                      <div className="overflow-x-auto max-h-96">
                        <Table>
                          <TableHeader className="sticky top-0 bg-muted/80 backdrop-blur-sm">
                            <TableRow>
                              <TableHead className="w-12 text-center">#</TableHead>
                              {sheet.headers.map((header) => (
                                <TableHead key={header} className="whitespace-nowrap">
                                  {header}
                                </TableHead>
                              ))}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {sheet.data.slice(0, 50).map((row, idx) => (
                              <TableRow key={idx}>
                                <TableCell className="text-center text-muted-foreground">
                                  {idx + 1}
                                </TableCell>
                                {sheet.headers.map((header) => (
                                  <TableCell key={header} className="max-w-[200px] truncate">
                                    {String(row[header] ?? '')}
                                  </TableCell>
                                ))}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                      {sheet.data.length > 50 && (
                        <div className="p-3 text-center text-sm text-muted-foreground bg-muted/30 border-t border-border/50">
                          Showing first 50 of {sheet.data.length} rows
                        </div>
                      )}
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
