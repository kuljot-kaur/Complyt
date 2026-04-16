'use client';

import { TopNavbar } from '@/components/TopNavbar';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';

const MOCK_HISTORY_DOCS = [
  { id: 'DOC001', filename: 'Invoice_2024_001.pdf', status: 'completed', score: 95, date: new Date('2024-03-15') },
  { id: 'DOC002', filename: 'ShippingDoc_456.pdf', status: 'completed', score: 87, date: new Date('2024-03-14') },
  { id: 'DOC003', filename: 'Certificate_789.pdf', status: 'flagged', score: 62, date: new Date('2024-03-13') },
  { id: 'DOC004', filename: 'Invoice_2024_002.pdf', status: 'pending', score: null, date: new Date('2024-03-12') },
  { id: 'DOC005', filename: 'ManifestData.pdf', status: 'completed', score: 78, date: new Date('2024-03-11') },
  { id: 'DOC006', filename: 'COODoc.pdf', status: 'completed', score: 91, date: new Date('2024-03-10') },
  { id: 'DOC007', filename: 'Invoice_2024_003.pdf', status: 'flagged', score: 55, date: new Date('2024-03-09') },
];

type FilterStatus = 'all' | 'compliant' | 'flagged' | 'pending';

export default function HistoryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');

  const filteredDocs = useMemo(() => {
    return MOCK_HISTORY_DOCS.filter((doc) => {
      const matchesSearch = doc.filename.toLowerCase().includes(searchQuery.toLowerCase()) || doc.id.toLowerCase().includes(searchQuery.toLowerCase());

      if (filterStatus === 'all') return matchesSearch;
      if (filterStatus === 'compliant') return matchesSearch && (doc.status === 'completed' && (doc.score ?? 0) >= 80);
      if (filterStatus === 'flagged') return matchesSearch && doc.status === 'flagged';
      if (filterStatus === 'pending') return matchesSearch && doc.status === 'pending';

      return matchesSearch;
    });
  }, [searchQuery, filterStatus]);

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

      <main className="max-w-[1440px] mx-auto px-8 py-10">
        {/* Header */}
        <header className="mb-12">
          <h1 className="text-5xl font-headline tracking-tight font-medium mb-2">Document History</h1>
          <p className="text-secondary italic font-body text-base">Browse and manage all processed documents</p>
        </header>

        {/* Search and Filters */}
        <div className="mb-8 flex flex-col md:flex-row gap-4">
          {/* Search Bar */}
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search by filename or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant rounded-lg focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
            <span className="material-symbols-outlined absolute right-3 top-3 text-outline opacity-70">search</span>
          </div>

          {/* Filter Buttons */}
          <div className="flex gap-2 flex-wrap">
            {(['all', 'compliant', 'flagged', 'pending'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setFilterStatus(filter)}
                className={`px-4 py-2 rounded-lg font-label font-semibold text-sm transition-all ${
                  filterStatus === filter
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-container text-secondary hover:bg-surface-container-high'
                }`}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Documents Table */}
        <div className="card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-outline-variant">
                  <th className="text-left py-4 px-4 font-label font-bold text-secondary">Document ID</th>
                  <th className="text-left py-4 px-4 font-label font-bold text-secondary">Filename</th>
                  <th className="text-left py-4 px-4 font-label font-bold text-secondary">Status</th>
                  <th className="text-left py-4 px-4 font-label font-bold text-secondary">Score</th>
                  <th className="text-left py-4 px-4 font-label font-bold text-secondary">Date</th>
                  <th className="text-left py-4 px-4 font-label font-bold text-secondary">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDocs.length > 0 ? (
                  filteredDocs.map((doc) => (
                    <tr key={doc.id} className="border-b border-outline-variant hover:bg-surface-container-low transition-colors">
                      <td className="py-4 px-4 font-label font-semibold text-on-surface">{doc.id}</td>
                      <td className="py-4 px-4 text-on-surface max-w-xs truncate">{doc.filename}</td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(doc.status)}`}>
                          <span className="material-symbols-outlined text-sm">{getStatusIcon(doc.status)}</span>
                          {doc.status}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        {doc.score !== null ? <span className="font-headline font-bold text-on-surface">{doc.score}</span> : <span className="text-secondary">—</span>}
                      </td>
                      <td className="py-4 px-4 text-secondary">{format(doc.date, 'MMM dd, yyyy')}</td>
                      <td className="py-4 px-4">
                        <div className="flex gap-2">
                          <Link href={`/results/${doc.id}`} className="text-primary hover:text-primary-container transition-colors font-label font-semibold">
                            View
                          </Link>
                          <button className="text-secondary hover:text-on-surface transition-colors">
                            <span className="material-symbols-outlined text-sm">download</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-secondary">
                      No documents found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-6 flex items-center justify-between pt-6 border-t border-outline-variant">
            <span className="text-sm text-secondary">Showing {filteredDocs.length} of {MOCK_HISTORY_DOCS.length} documents</span>
            <div className="flex gap-2">
              <button className="px-3 py-2 border border-outline-variant rounded-lg hover:bg-surface-container transition-colors text-sm">Previous</button>
              <button className="px-3 py-2 bg-primary text-on-primary rounded-lg hover:opacity-90 transition-colors text-sm">1</button>
              <button className="px-3 py-2 border border-outline-variant rounded-lg hover:bg-surface-container transition-colors text-sm">2</button>
              <button className="px-3 py-2 border border-outline-variant rounded-lg hover:bg-surface-container transition-colors text-sm">Next</button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
