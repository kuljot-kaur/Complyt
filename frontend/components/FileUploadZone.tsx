'use client';

import { useState, useRef } from 'react';

interface FileUploadZoneProps {
  onFileSelect: (file: File) => void;
  isLoading?: boolean;
  maxSize?: number; // in MB
  accept?: string;
}

const SUPPORTED_FORMATS = ['PDF', 'PNG', 'JPG', 'DOCX'];
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

export function FileUploadZone({ onFileSelect, isLoading = false, maxSize = 25, accept = '.pdf,.png,.jpg,.jpeg,.docx' }: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      handleFile(file);
    }
  };

  const handleFile = (file: File) => {
    if (file.size > MAX_FILE_SIZE) {
      alert(`File size exceeds ${maxSize}MB limit`);
      return;
    }
    setSelectedFile(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      onFileSelect(selectedFile);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`group relative bg-surface-container-lowest paper-fold rounded-xl border-2 border-dashed transition-all duration-300 ruled-bg min-h-[480px] flex flex-col items-center justify-center p-12 text-center cursor-pointer ${
          isDragging ? 'border-primary bg-primary/5' : 'border-outline-variant hover:border-primary'
        }`}
      >
        <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/[0.02] transition-colors pointer-events-none rounded-xl"></div>

        <div className="mb-6 h-20 w-20 rounded-full bg-surface-container-low flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
          <span className="material-symbols-outlined text-4xl text-primary">upload_file</span>
        </div>

        <h2 className="font-headline text-2xl mb-2 text-on-surface">Drag and drop your dossier</h2>
        <p className="text-secondary text-sm mb-8 font-body">Or click to browse your local repository</p>

        <div className="flex flex-wrap justify-center gap-3 mb-10">
          {SUPPORTED_FORMATS.map((format) => (
            <span key={format} className="px-3 py-1 bg-tertiary-fixed text-on-tertiary-fixed text-[10px] uppercase tracking-widest font-bold rounded-sm">
              {format}
            </span>
          ))}
        </div>

        <p className="text-outline text-xs font-medium mb-6">Maximum permitted file size: {maxSize}MB</p>

        {selectedFile ? (
          <div className="text-center">
            <span className="material-symbols-outlined text-4xl text-primary mb-2">check_circle</span>
            <p className="text-sm font-medium text-on-surface mb-2">{selectedFile.name}</p>
            <p className="text-xs text-secondary">{(selectedFile.size / 1024 / 1024).toFixed(2)}MB</p>
          </div>
        ) : (
          <input
            ref={fileInputRef}
            aria-label="Upload document"
            className="absolute inset-0 opacity-0 cursor-pointer"
            type="file"
            accept={accept}
            onChange={handleFileInputChange}
          />
        )}
      </div>

      <div className="flex items-center justify-end space-x-4">
        <button
          onClick={handleReset}
          disabled={!selectedFile || isLoading}
          className="px-6 py-2.5 font-label font-medium text-secondary hover:text-on-surface transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Reset
        </button>
        <button
          onClick={handleUpload}
          disabled={!selectedFile || isLoading}
          className="px-8 py-2.5 bg-gradient-to-r from-primary to-primary-container text-white rounded-lg font-label font-bold shadow-lg hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="animate-spin">
                <span className="material-symbols-outlined text-sm">hourglass_empty</span>
              </div>
              Uploading...
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-sm">cloud_upload</span>
              Upload & Analyze
            </>
          )}
        </button>
      </div>
    </div>
  );
}
