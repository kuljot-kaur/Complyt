'use client';

import { TopNavbar } from '@/components/TopNavbar';
import { useState } from 'react';
import { DashboardStats } from '@/types';
import Link from 'next/link';
import { format } from 'date-fns';

const MOCK_DOCUMENTS = [
  {
    id: 'DOC001',
    filename: 'Invoice_2024_001.pdf',
    status: 'completed' as const,
    score: 95,
    date: new Date('2024-03-15'),
  },
  {
    id: 'DOC002',
    filename: 'ShippingDoc_456.pdf',
    status: 'completed' as const,
    score: 87,
    date: new Date('2024-03-14'),
  },
  {
    id: 'DOC003',
    filename: 'Certificate_789.pdf',
    status: 'flagged' as const,
    score: 62,
    date: new Date('2024-03-13'),
  },
  {
    id: 'DOC004',
    filename: 'Invoice_2024_002.pdf',
    status: 'pending' as const,
    score: null,
    date: new Date('2024-03-12'),
  },
];

export default function DashboardPage() {
  const [stats] = useState<DashboardStats>({
    totalDocuments: 128,
    avgComplianceScore: 89,
    pendingDocuments: 4,
    flaggedDocuments: 12,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-primary/10 text-primary';
      case 'pending':
        return 'bg-tertiary/10 text-tertiary';
      case 'flagged':
        return 'bg-error/10 text-error';
      default:
        return 'bg-surface-container text-secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return 'check_circle';
      case 'pending':
        return 'schedule';
      case 'flagged':
        return 'error';
      default:
        return 'help';
    }
  };

  return (
    <>
      <TopNavbar />

      <main className="max-w-[1600px] mx-auto px-8 py-12">
        {/* Header */}
        <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p className="text-secondary font-label text-sm uppercase tracking-widest mb-2">Internal Ledger</p>
            <h1 className="font-headline text-5xl font-bold tracking-tight text-on-surface">Compliance Dashboard</h1>
            <p className="text-on-surface-variant mt-2 font-body italic">"The digital archive of absolute truth."</p>
          </div>
          <div className="flex gap-3">
            <button className="px-6 py-2.5 bg-surface-container-high text-on-surface font-medium rounded-lg hover:bg-surface-variant transition-all">
              Export Archive
            </button>
            <Link
              href="/upload"
              className="px-6 py-2.5 bg-gradient-to-r from-primary to-primary-container text-white font-medium rounded-lg shadow-lg shadow-primary/10 hover:opacity-90 active:scale-95 transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              New Document
            </Link>
          </div>
        </header>

        {/* KPI Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          {/* Total Processed */}
          <div className="card relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <span className="material-symbols-outlined text-6xl">inventory_2</span>
            </div>
            <p className="text-secondary font-medium text-sm mb-1">Total Documents Processed</p>
            <div className="flex items-baseline gap-2">
              <h2 className="font-headline text-4xl font-bold">{stats.totalDocuments}</h2>
              <span className="text-primary text-xs font-bold">+12%</span>
            </div>
            <div className="mt-4 w-full bg-surface-container h-1 rounded-full overflow-hidden">
              <div className="bg-primary h-full w-3/4"></div>
            </div>
          </div>

          {/* Avg Score */}
          <div className="card relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <span className="material-symbols-outlined text-6xl">trending_up</span>
            </div>
            <p className="text-secondary font-medium text-sm mb-1">Avg Compliance Score</p>
            <div className="flex items-baseline gap-2">
              <h2 className="font-headline text-4xl font-bold text-primary">{stats.avgComplianceScore}</h2>
              <span className="text-xs text-secondary">/100</span>
            </div>
          </div>

          {/* Pending Documents */}
          <div className="card relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <span className="material-symbols-outlined text-6xl">schedule</span>
            </div>
            <p className="text-secondary font-medium text-sm mb-1">Pending Documents</p>
            <div className="flex items-baseline gap-2">
              <h2 className="font-headline text-4xl font-bold text-tertiary">{stats.pendingDocuments}</h2>
              <span className="text-xs text-secondary">pending</span>
            </div>
          </div>

          {/* Flagged Issues */}
          <div className="card relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <span className="material-symbols-outlined text-6xl">error</span>
            </div>
            <p className="text-secondary font-medium text-sm mb-1">Flagged Errors</p>
            <div className="flex items-baseline gap-2">
              <h2 className="font-headline text-4xl font-bold text-error">{stats.flaggedDocuments}</h2>
              <span className="text-xs text-secondary">require review</span>
            </div>
          </div>
        </div>

        {/* Recent Documents Table */}
        <div className="card">
          <div className="mb-6">
            <h2 className="font-headline text-2xl font-bold">Recent Documents</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-outline-variant">
                  <th className="text-left py-3 px-4 font-label font-bold text-secondary">Document ID</th>
                  <th className="text-left py-3 px-4 font-label font-bold text-secondary">Filename</th>
                  <th className="text-left py-3 px-4 font-label font-bold text-secondary">Status</th>
                  <th className="text-left py-3 px-4 font-label font-bold text-secondary">Score</th>
                  <th className="text-left py-3 px-4 font-label font-bold text-secondary">Date</th>
                  <th className="text-left py-3 px-4 font-label font-bold text-secondary">Action</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_DOCUMENTS.map((doc) => (
                  <tr key={doc.id} className="border-b border-outline-variant hover:bg-surface-container-low transition-colors">
                    <td className="py-3 px-4 font-label font-semibold text-on-surface">{doc.id}</td>
                    <td className="py-3 px-4 text-on-surface">{doc.filename}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(doc.status)}`}>
                        <span className="material-symbols-outlined text-sm">{getStatusIcon(doc.status)}</span>
                        {doc.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {doc.score !== null ? (
                        <span className="font-headline font-bold text-on-surface">{doc.score}</span>
                      ) : (
                        <span className="text-secondary">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-secondary">{format(doc.date, 'MMM dd, yyyy')}</td>
                    <td className="py-3 px-4">
                      <Link href={`/results/${doc.id}`} className="text-primary hover:text-primary-container transition-colors font-label font-semibold">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </>
  );
}
