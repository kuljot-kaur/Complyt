'use client';

import { TopNavbar } from '@/components/TopNavbar';
import { ComplianceScoreMeter } from '@/components/ComplianceScoreMeter';
import { ComplianceReport } from '@/components/ComplianceReport';
import { ExtractedFields } from '@/components/ExtractedFields';
import { useEffect, useState } from 'react';
import { ExtractedData } from '@/types';
import Link from 'next/link';
import { format } from 'date-fns';

interface ResultsPageProps {
  params: {
    id: string;
  };
}

// Mock data
const MOCK_RESULT = {
  id: 'INV-2024-089',
  score: 92,
  status: 'Compliant',
  date: new Date('2024-03-15'),
  errors: [
    {
      code: 'CURRENCY_MISMATCH',
      field: 'currency',
      message: 'Currency field missing in exporter declaration',
      severity: 'error' as const,
    },
  ],
  warnings: [
    {
      code: 'MISSING_PHONE',
      field: 'importerAddress',
      message: 'Missing consignee phone number — recommended for delivery',
      severity: 'warning' as const,
    },
    {
      code: 'WEIGHT_MISMATCH',
      field: 'grossWeightKg',
      message: 'Weight mismatch detected between packing list and manifest',
      severity: 'warning' as const,
    },
  ],
  data: {
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
};

export default function ResultsPage({ params }: ResultsPageProps) {
  const [result] = useState(MOCK_RESULT);

  useEffect(() => {
    // Fetch result from API if needed
    // const fetchResult = async () => {
    //   try {
    //     const data = await apiClient.getDocument(params.id);
    //     setResult(data);
    //   } catch (err) {
    //     console.error('Error fetching results:', err);
    //   }
    // };
    // fetchResult();
  }, [params.id]);

  const getStatusColor = (status: string) => {
    if (status === 'Compliant') return 'text-primary';
    if (status === 'Warning') return 'text-tertiary';
    return 'text-error';
  };

  return (
    <>
      <TopNavbar />

      <main className="max-w-[1440px] mx-auto px-8 py-10">
        {/* Header */}
        <header className="mb-12">
          <h1 className="text-5xl font-headline tracking-tight font-medium mb-2">Audit Report: #{result.id}</h1>
          <p className="text-secondary italic font-headline text-lg">Verified by The Curator on {format(result.date, 'MMMM dd, yyyy')}</p>
        </header>

        {/* Summary Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          {/* Compliance Score */}
          <div className="card">
            <div className="flex flex-col justify-between h-full">
              <span className="font-label font-medium text-secondary text-sm mb-3">Compliance Score</span>
              <div className="flex items-baseline gap-2">
                <span className="text-6xl font-headline font-bold text-primary">{result.score}</span>
                <span className="text-xl font-headline text-secondary italic">/100</span>
              </div>
              <div className="mt-4 text-xs text-secondary italic">Overall compliance assessment</div>
            </div>
          </div>

          {/* Critical Errors */}
          <div className="card">
            <div className="flex flex-col justify-between h-full">
              <span className="font-label font-medium text-secondary text-sm mb-3">Critical Errors</span>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-error" style={{ fontVariationSettings: "'FILL' 1" }}>
                  error
                </span>
                <span className="text-5xl font-headline font-bold text-on-surface">{result.errors.length}</span>
              </div>
            </div>
          </div>

          {/* Warnings */}
          <div className="card">
            <div className="flex flex-col justify-between h-full">
              <span className="font-label font-medium text-secondary text-sm mb-3">Warnings</span>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-tertiary">warning</span>
                <span className="text-5xl font-headline font-bold text-on-surface">{result.warnings.length}</span>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="card">
            <div className="flex flex-col justify-between h-full">
              <span className="font-label font-medium text-secondary text-sm mb-3">Document Status</span>
              <span className={`text-4xl font-headline font-bold ${getStatusColor(result.status)}`}>{result.status}</span>
            </div>
          </div>
        </div>

        {/* Main Content - Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* LEFT: Extracted Data */}
          <div>
            <h2 className="font-headline text-2xl font-bold mb-6 text-on-surface">Extracted Document Fields</h2>
            <ExtractedFields data={result.data} editable={true} />
          </div>

          {/* RIGHT: Compliance Report & Score Meter */}
          <div className="space-y-8">
            <div>
              <h2 className="font-headline text-2xl font-bold mb-6 text-on-surface">Compliance Assessment</h2>
              <div className="flex justify-center mb-8">
                <ComplianceScoreMeter score={result.score} size="md" />
              </div>
            </div>

            <ComplianceReport errors={result.errors} warnings={result.warnings} />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="card flex flex-col sm:flex-row gap-4 justify-end">
          <button className="btn-secondary">
            <span className="material-symbols-outlined">download</span>
            Download Report
          </button>
          <button className="btn-secondary">
            <span className="material-symbols-outlined">share</span>
            Share Results
          </button>
          <Link href="/upload" className="btn-primary text-center">
            <span className="material-symbols-outlined">add</span>
            Process New Document
          </Link>
        </div>
      </main>
    </>
  );
}
