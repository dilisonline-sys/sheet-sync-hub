import AppLayout from '@/components/layout/AppLayout';
import { ExcelImport } from '@/components/import/ExcelImport';
import { DownloadPackage } from '@/components/download/DownloadPackage';

const Import = () => {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Data Import & Export</h1>
          <p className="text-muted-foreground mt-1">
            Import data from Excel and download backend package
          </p>
        </div>
        
        <div className="grid gap-6 lg:grid-cols-2">
          <ExcelImport />
          <DownloadPackage />
        </div>
      </div>
    </AppLayout>
  );
};

export default Import;
