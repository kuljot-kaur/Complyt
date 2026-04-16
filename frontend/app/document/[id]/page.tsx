'use client';

import { TopNavbar } from '@/components/TopNavbar';
import { ExtractedFields } from '@/components/ExtractedFields';
import { ComplianceReport } from '@/components/ComplianceReport';
import { ComplianceScoreMeter } from '@/components/ComplianceScoreMeter';
import { useEffect, useState } from 'react';
import { ExtractedData, ComplianceError, ComplianceWarning } from '@/types';
import { format } from 'date-fns';

interface DocumentDetailPageProps {
  params: {
    id: string;
  };
}

// Mock data matching the results page
const MOCK_DOCUMENT_DETAIL = {
  id: 'DOC001',
  filename: 'Invoice_2024_001.pdf',
  uploadedAt: new Date('2024-03-15'),
  processedAt: new Date('2024-03-15T10:35:00'),
  status: 'completed',
  score: 95,
  extractedData: {
    exporterName: 'ABC Manufacturing Co., Ltd.',
    exporterAddress: '123 Industrial Park, Shanghai, China 201234',
    importerName: 'Global Imports Inc.',
    importerAddress: '456 Commerce Street, New York, NY 10001, USA',
    invoiceNumber: 'INV-2024-001567',
    invoiceDate: '2024-03-15',
    currency: 'USD',
    totalValue: 5250.0,
    incoterms: 'FOB',
    countryOfOrigin: 'China',
    countryOfDestination: 'United States',
    portOfLoading: 'Shanghai',
    portOfDischarge: 'Newark',
    goodsDescription: 'Electronic Components - Computer Circuit Boards',
    hsCode: '853400',
    hsSource: 'extracted' as const,
    netWeightKg: 125.5,
    grossWeightKg: 150.0,
    quantity: 500,
    unitOfMeasure: 'PCS',
  } as ExtractedData,
  errors: [] as ComplianceError[],
  warnings: [] as ComplianceWarning[],
  timeline: [
    { step: 'uploaded', time: new Date('2024-03-15T10:00:00'), label: 'Document Uploaded' },
    { step: 'ocr', time: new Date('2024-03-15T10:01:00'), label: 'OCR Processing' },
    { step: 'extraction', time: new Date('2024-03-15T10:02:30'), label: 'AI Field Extraction' },
    { step: 'validation', time: new Date('2024-03-15T10:03:45'), label: 'Compliance Validation' },
    { step: 'completed', time: new Date('2024-03-15T10:05:00'), label: 'Processing Completed' },
  ],
};

export default function DocumentDetailPage({ params }: DocumentDetailPageProps) {
  const [document] = useState(MOCK_DOCUMENT_DETAIL);

  useEffect(() => {
    // Fetch document details from API
    // const fetchDocument = async () => {
    //   try {
    //     const data = await apiClient.getDocument(params.id);
    //     setDocument(data);
    //   } catch (err) {
    //     console.error('Error fetching document:', err);
    //   }
    // };
    // fetchDocument();
  }, [params.id]);

  return (
    <>
      <TopNavbar />

      <main className="max-w-[1440px] mx-auto px-8 py-10">
        {/* Header */}
        <header className="mb-12">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h1 className="text-5xl font-headline tracking-tight font-medium mb-2">{document.filename}</h1>
              <p className="text-secondary italic font-body">Document ID: {document.id}</p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-headline font-bold text-primary mb-1">{document.score}</div>
              <div className="text-xs font-label uppercase tracking-widest text-secondary">Compliance</div>
            </div>
          </div>
        </header>

        {/* Timeline */}
        <div className="card mb-12">
          <h2 className="font-headline text-2xl font-bold mb-6 text-on-surface">Processing Timeline</h2>

          <div className="space-y-4">
            {document.timeline.map((entry, index) => (
              <div key={entry.step} className="flex gap-4">
                {/* Timeline dot */}
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center">
                    <span className="material-symbols-outlined text-sm text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                      check
                    </span>
                  </div>
                  {index < document.timeline.length - 1 && <div className="w-1 h-12 bg-primary/20 mt-2"></div>}
                </div>

                {/* Timeline content */}
                <div className="pt-2 pb-4">
                  <h3 className="font-label font-bold text-on-surface">{entry.label}</h3>
                  <p className="text-sm text-secondary">{format(entry.time, 'HH:mm:ss')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content - Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* LEFT: Original Document Preview */}
          <div className="card">
            <h2 className="font-headline text-2xl font-bold mb-6 text-on-surface">Original Document</h2>
            <div className="bg-surface-container rounded-lg p-8 text-center">
              <div className="flex justify-center mb-4">
                <span className="material-symbols-outlined text-6xl text-primary opacity-50">description</span>
              </div>
              <p className="text-sm text-secondary mb-4">{document.filename}</p>
              <button className="px-6 py-2 bg-primary text-on-primary rounded-lg font-label font-semibold hover:opacity-90 transition-colors">
                View Original
              </button>
            </div>
          </div>

          {/* RIGHT: Score Meter & Quick Stats */}
          <div className="space-y-6">
            <div className="card flex flex-col items-center">
              <h2 className="font-headline text-2xl font-bold mb-6 text-on-surface">Compliance Score</h2>
              <ComplianceScoreMeter score={document.score} size="md" />
            </div>

            <div className="card">
              <h3 className="font-label font-bold text-secondary text-sm mb-4 uppercase tracking-widest">Processing Details</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-secondary">Uploaded</span>
                  <span className="font-semibold text-on-surface">{format(document.uploadedAt, 'MMM dd, yyyy HH:mm')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary">Processed</span>
                  <span className="font-semibold text-on-surface">{format(document.processedAt!, 'MMM dd, yyyy HH:mm')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary">Duration</span>
                  <span className="font-semibold text-on-surface">5m 0s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary">Status</span>
                  <span className="font-semibold text-primary capitalize">{document.status}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Extracted Fields */}
        <div className="mb-12">
          <h2 className="font-headline text-2xl font-bold mb-6 text-on-surface">Extracted Fields</h2>
          <ExtractedFields data={document.extractedData} editable={false} />
        </div>

        {/* Compliance Report */}
        <div className="mb-12">
          <h2 className="font-headline text-2xl font-bold mb-6 text-on-surface">Compliance Issues</h2>
          <ComplianceReport errors={document.errors} warnings={document.warnings} />
        </div>

        {/* Actions */}
        <div className="card flex flex-col sm:flex-row gap-4 justify-end">
          <button className="btn-secondary">
            <span className="material-symbols-outlined">download</span>
            Download
          </button>
          <button className="btn-secondary">
            <span className="material-symbols-outlined">share</span>
            Share
          </button>
          <button className="btn-primary">
            <span className="material-symbols-outlined">edit</span>
            Edit & Re-validate
          </button>
        </div>
      </main>
    </>
  );
}
