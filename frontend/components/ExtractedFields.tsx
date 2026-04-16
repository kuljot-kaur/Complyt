'use client';

import { ExtractedData } from '@/types';
import { useState } from 'react';

interface ExtractedFieldsProps {
  data?: ExtractedData | null;
  editable?: boolean;
}

export function ExtractedFields({ data, editable = true }: ExtractedFieldsProps) {
  const [edditedData, setEditedData] = useState<ExtractedData | null>(data || null);

  const handleFieldChange = (field: keyof ExtractedData, value: any) => {
    if (edditedData) {
      setEditedData({
        ...edditedData,
        [field]: value,
      });
    }
  };

  const fields = edditedData;

  if (!fields) {
    return <div className="card text-center py-8 text-secondary">No extracted data available</div>;
  }

  const fieldGroups = [
    {
      group: 'Exporter Information',
      fields: [
        { key: 'exporterName' as const, label: 'Exporter Name' },
        { key: 'exporterAddress' as const, label: 'Exporter Address' },
      ],
    },
    {
      group: 'Importer Information',
      fields: [
        { key: 'importerName' as const, label: 'Importer Name' },
        { key: 'importerAddress' as const, label: 'Importer Address' },
      ],
    },
    {
      group: 'Invoice Details',
      fields: [
        { key: 'invoiceNumber' as const, label: 'Invoice Number' },
        { key: 'invoiceDate' as const, label: 'Invoice Date' },
      ],
    },
    {
      group: 'Shipment Details',
      fields: [
        { key: 'currency' as const, label: 'Currency' },
        { key: 'totalValue' as const, label: 'Total Value' },
        { key: 'incoterms' as const, label: 'Incoterms' },
      ],
    },
    {
      group: 'Location Details',
      fields: [
        { key: 'countryOfOrigin' as const, label: 'Country of Origin' },
        { key: 'countryOfDestination' as const, label: 'Country of Destination' },
        { key: 'portOfLoading' as const, label: 'Port of Loading' },
        { key: 'portOfDischarge' as const, label: 'Port of Discharge' },
      ],
    },
    {
      group: 'Goods Information',
      fields: [
        { key: 'goodsDescription' as const, label: 'Goods Description' },
        { key: 'hsCode' as const, label: 'HS Code' },
        { key: 'quantity' as const, label: 'Quantity' },
        { key: 'unitOfMeasure' as const, label: 'Unit of Measure' },
      ],
    },
    {
      group: 'Weight Information',
      fields: [
        { key: 'netWeightKg' as const, label: 'Net Weight (kg)' },
        { key: 'grossWeightKg' as const, label: 'Gross Weight (kg)' },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {fieldGroups.map((group) => (
        <div key={group.group} className="card">
          <h3 className="font-headline text-lg font-bold mb-4 text-primary">{group.group}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {group.fields.map((field) => (
              <div key={field.key} className="space-y-1">
                <label className="text-xs font-label uppercase tracking-widest text-secondary">{field.label}</label>
                <input
                  type="text"
                  value={fields[field.key] ?? ''}
                  onChange={(e) => handleFieldChange(field.key, e.target.value)}
                  disabled={!editable}
                  className={`w-full px-3 py-2 border border-outline-variant rounded-lg bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary transition-all disabled:bg-surface-container-high disabled:cursor-not-allowed ${
                    !editable ? 'text-secondary' : 'text-on-surface'
                  }`}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
