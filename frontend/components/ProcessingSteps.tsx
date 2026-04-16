'use client';

interface ProcessingStepProps {
  steps: Array<{
    id: string;
    title: string;
    description: string;
    status: 'completed' | 'in-progress' | 'pending';
  }>;
  progress: number;
}

export function ProcessingSteps({ steps, progress }: ProcessingStepProps) {
  return (
    <div className="space-y-8">
      {/* Progress Bar */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-label uppercase tracking-widest text-secondary">Processing Progress</span>
          <span className="text-3xl font-headline font-bold text-primary">{progress}%</span>
        </div>
        <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-primary-container transition-all duration-1000 rounded-full"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {/* Steps */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-start space-x-4">
            <div
              className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                step.status === 'completed'
                  ? 'bg-primary text-on-primary'
                  : step.status === 'in-progress'
                    ? 'border-2 border-primary bg-primary/10'
                    : 'bg-surface-container text-secondary'
              }`}
            >
              {step.status === 'completed' ? (
                <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                  check
                </span>
              ) : step.status === 'in-progress' ? (
                <div className="w-3 h-3 bg-primary rounded-full animate-pulse-light"></div>
              ) : (
                <span className="text-sm font-bold">{index + 1}</span>
              )}
            </div>

            <div>
              <h3 className={`font-label font-bold text-sm ${step.status === 'completed' ? 'text-on-surface' : 'text-secondary'}`}>{step.title}</h3>
              <p className="text-xs text-outline italic">{step.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
