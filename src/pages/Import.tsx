import AppLayout from '@/components/layout/AppLayout';
import { ExcelImport } from '@/components/import/ExcelImport';

const Import = () => {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Data Import</h1>
          <p className="text-muted-foreground mt-1">
            Import database checks from Excel spreadsheets
          </p>
        </div>
        
        <ExcelImport />
      </div>
    </AppLayout>
  );
};

export default Import;
