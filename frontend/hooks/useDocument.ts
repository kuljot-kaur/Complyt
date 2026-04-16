import { useCallback, useState } from 'react';
import { ProcessingResponse } from '@/types';
import { apiClient } from '@/lib/api';

export const useDocumentUpload = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ProcessingResponse | null>(null);

  const upload = useCallback(async (file: File) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.uploadDocument(file);
      setResult(response);
      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { upload, isLoading, error, result };
};

export const usePollingStatus = (documentId: string, interval: number = 1000) => {
  const [status, setStatus] = useState<any>(null);
  const [isPolling, setIsPolling] = useState(false);

  const startPolling = useCallback(async () => {
    setIsPolling(true);
    const poll = async () => {
      try {
        const data = await apiClient.getProcessingStatus(documentId);
        setStatus(data);

        if (data.status !== 'processing') {
          setIsPolling(false);
        } else {
          setTimeout(poll, interval);
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    };

    poll();
  }, [documentId, interval]);

  const stopPolling = useCallback(() => {
    setIsPolling(false);
  }, []);

  return { status, isPolling, startPolling, stopPolling };
};
