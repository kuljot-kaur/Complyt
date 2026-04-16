'use client';

import { TopNavbar } from '@/components/TopNavbar';
import { ProcessingSteps } from '@/components/ProcessingSteps';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface ProcessingPageProps {
  params: {
    id: string;
  };
}

const PROCESSING_STEPS = [
  {
    id: 'ocr',
    title: 'OCR extraction',
    description: 'Generating text from document images',
    status: 'completed' as const,
  },
  {
    id: 'extraction',
    title: 'AI field extraction',
    description: 'Identifying and extracting key attributes',
    status: 'completed' as const,
  },
  {
    id: 'classification',
    title: 'HS classification',
    description: 'Validating and predicting trade codes',
    status: 'in-progress' as const,
  },
  {
    id: 'validation',
    title: 'Compliance validation',
    description: 'Checking rules and scoring document',
    status: 'pending' as const,
  },
  {
    id: 'completed',
    title: 'Final scoring',
    description: 'Generating comprehensive report',
    status: 'pending' as const,
  },
];

export default function ProcessingPage({ params }: ProcessingPageProps) {
  const router = useRouter();
  const [progress, setProgress] = useState(40);
  const [steps, setSteps] = useState(PROCESSING_STEPS);

  useEffect(() => {
    // Simulate processing steps
    const timings = [2000, 4000, 6000, 8000, 10000];
    const timers = timings.map((timing, index) => {
      return setTimeout(() => {
        setSteps((prev) =>
          prev.map((step, i) => {
            if (i === index) return { ...step, status: 'completed' as const };
            if (i === index + 1) return { ...step, status: 'in-progress' as const };
            return step;
          })
        );
        setProgress((prev) => Math.min(prev + 20, 100));
      }, timing);
    });

    // Redirect after completion
    const redirectTimer = setTimeout(() => {
      router.push(`/results/${params.id}`);
    }, 12000);

    return () => {
      timers.forEach((timer) => clearTimeout(timer));
      clearTimeout(redirectTimer);
    };
  }, [params.id, router]);

  return (
    <>
      <TopNavbar />

      <main className="min-h-[calc(100vh-72px)] ruled-line-bg flex items-center justify-center px-4 py-12">
        <div className="max-w-3xl w-full">
          <div className="bg-surface-container-lowest paper-fold p-12 rounded-xl relative shadow-whisper border border-outline-variant/30">
            <div className="absolute top-0 right-0 w-8 h-8 bg-gradient-to-bl from-surface-container-high to-transparent opacity-40"></div>

            <header className="mb-12">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                <div>
                  <span className="font-label text-xs tracking-[0.2em] uppercase text-secondary mb-2 block">System Status: Active Analysis</span>
                  <h1 className="font-headline text-5xl font-bold tracking-tight text-on-surface">Curating the Record</h1>
                </div>
                <div className="flex flex-col items-center md:items-end">
                  <span className="font-headline text-4xl font-semibold text-primary">{progress}%</span>
                  <span className="font-label text-[10px] text-outline uppercase tracking-widest">Processing</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-primary-container transition-all duration-1000 rounded-full"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </header>

            {/* Processing Steps */}
            <ProcessingSteps steps={steps} progress={progress} />

            {/* Metadata Info */}
            <div className="mt-12 p-6 bg-surface-container/30 border border-outline-variant/20 rounded-lg">
              <p className="text-xs text-secondary italic">
                <strong>Document ID:</strong> {params.id}
                <br />
                <strong>Processing Pipeline:</strong> v2.1.0
                <br />
                <strong>Estimated Time Remaining:</strong> {Math.max(0, 12 - Math.round(progress / 10))} seconds
              </p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
