'use client';

import { TopNavbar } from '@/components/TopNavbar';
import { FileUploadZone } from '@/components/FileUploadZone';
import { useRouter } from 'next/navigation';
import { useDocumentUpload } from '@/hooks/useDocument';

export default function UploadPage() {
  const router = useRouter();
  const { upload, isLoading, error } = useDocumentUpload();

  const handleFileSelect = async (file: File) => {
    try {
      const result = await upload(file);
      
      // Store the result temporarily and redirect to processing
      sessionStorage.setItem('processResult', JSON.stringify(result));
      
      // Simulate document ID
      const docId = 'DOC_' + Date.now();
      router.push(`/processing/${docId}`);
    } catch (err) {
      console.error('Upload failed:', err);
    }
  };

  return (
    <>
      <TopNavbar />

      <main className="max-w-7xl mx-auto px-8 py-12">
        {/* Header */}
        <header className="mb-12">
          <h1 className="font-headline text-5xl tracking-tight text-on-surface mb-2">Ingest Intelligence</h1>
          <p className="text-secondary font-body max-w-2xl italic">
            Securely upload documents for automated compliance verification and semantic analysis.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* LEFT: Upload Zone */}
          <div className="lg:col-span-7">
            <FileUploadZone onFileSelect={handleFileSelect} isLoading={isLoading} />
          </div>

          {/* RIGHT: AI Processing Info */}
          <div className="lg:col-span-5">
            <div className="card sticky top-28">
              <h2 className="font-headline text-2xl font-bold mb-6 text-primary">AI Processing Pipeline</h2>

              <div className="space-y-4">
                {/* OCR Extraction */}
                <div className="flex items-center space-x-4 p-4 rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary">image_search</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-label font-bold text-sm text-on-surface">OCR Extraction</h3>
                    <p className="text-xs text-secondary">Converts images to structured text</p>
                  </div>
                  <span className="material-symbols-outlined text-secondary/40">check_circle</span>
                </div>

                {/* Field Detection */}
                <div className="flex items-center space-x-4 p-4 rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary">data_exploration</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-label font-bold text-sm text-on-surface">Field Detection</h3>
                    <p className="text-xs text-secondary">Extracts 19 key document fields</p>
                  </div>
                  <span className="material-symbols-outlined text-secondary/40">check_circle</span>
                </div>

                {/* HS Classification */}
                <div className="flex items-center space-x-4 p-4 rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary">category</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-label font-bold text-sm text-on-surface">HS Classification</h3>
                    <p className="text-xs text-secondary">Validates or predicts trade codes</p>
                  </div>
                  <span className="material-symbols-outlined text-secondary/40">check_circle</span>
                </div>

                {/* Compliance Check */}
                <div className="flex items-center space-x-4 p-4 rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary">verified_user</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-label font-bold text-sm text-on-surface">Compliance Check</h3>
                    <p className="text-xs text-secondary">8-rule validation & scoring</p>
                  </div>
                  <span className="material-symbols-outlined text-secondary/40">check_circle</span>
                </div>

                {/* PII Protection */}
                <div className="flex items-center space-x-4 p-4 rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary">security</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-label font-bold text-sm text-on-surface">PII Protection</h3>
                    <p className="text-xs text-secondary">Enterprise-grade encryption</p>
                  </div>
                  <span className="material-symbols-outlined text-secondary/40">check_circle</span>
                </div>
              </div>

              {error && (
                <div className="mt-4 p-4 bg-error/10 border-l-4 border-error rounded text-error text-sm">
                  {error}
                </div>
              )}

              <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                <p className="text-xs text-secondary italic">All processing happens in real-time with 99.9% uptime SLA</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
