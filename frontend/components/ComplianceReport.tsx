'use client';

import { ComplianceError, ComplianceWarning } from '@/types';

interface ComplianceReportProps {
  errors?: ComplianceError[];
  warnings?: ComplianceWarning[];
}

export function ComplianceReport({ errors = [], warnings = [] }: ComplianceReportProps) {
  return (
    <div className="space-y-6">
      {/* Errors Section */}
      {errors.length > 0 && (
        <div className="card">
          <h3 className="font-headline text-lg font-bold mb-4 flex items-center gap-2 text-error">
            <span className="material-symbols-outlined">error</span>
            Critical Errors ({errors.length})
          </h3>
          <div className="space-y-3">
            {errors.map((error, idx) => (
              <div key={idx} className="p-3 bg-error-container/10 border-l-4 border-error rounded">
                <p className="text-sm font-label font-semibold text-on-surface mb-1">{error.message}</p>
                {error.field && <span className="text-xs text-secondary italic">Field: {error.field}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Warnings Section */}
      {warnings.length > 0 && (
        <div className="card">
          <h3 className="font-headline text-lg font-bold mb-4 flex items-center gap-2 text-tertiary">
            <span className="material-symbols-outlined">warning</span>
            Warnings ({warnings.length})
          </h3>
          <div className="space-y-3">
            {warnings.map((warning, idx) => (
              <div key={idx} className="p-3 bg-tertiary/10 border-l-4 border-tertiary rounded">
                <p className="text-sm font-label font-semibold text-on-surface mb-1">{warning.message}</p>
                {warning.field && <span className="text-xs text-secondary italic">Field: {warning.field}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {errors.length === 0 && warnings.length === 0 && (
        <div className="card text-center py-8">
          <span className="material-symbols-outlined text-4xl text-primary mb-2 block" style={{ fontVariationSettings: "'FILL' 1" }}>
            check_circle
          </span>
          <p className="text-sm text-secondary">No errors or warnings</p>
        </div>
      )}
    </div>
  );
}
