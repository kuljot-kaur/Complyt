'use client';

interface ComplianceScoreMeterProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
}

export function ComplianceScoreMeter({ score, size = 'lg' }: ComplianceScoreMeterProps) {
  const sizeClasses = {
    sm: 'w-20 h-20',
    md: 'w-32 h-32',
    lg: 'w-48 h-48',
  };

  const textSizes = {
    sm: 'text-2xl',
    md: 'text-4xl',
    lg: 'text-6xl',
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 75) return 'Good';
    if (score >= 50) return 'Fair';
    return 'Poor';
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-primary';
    if (score >= 75) return 'text-tertiary';
    if (score >= 50) return 'text-yellow-500';
    return 'text-error';
  };

  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className={`flex flex-col items-center justify-center ${sizeClasses[size]}`}>
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
        {/* Background circle */}
        <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="2" fill="none" className="text-surface-container opacity-30" />

        {/* Progress circle */}
        <circle
          cx="50"
          cy="50"
          r="45"
          stroke="currentColor"
          strokeWidth="3"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={`transition-all duration-1000 ${getScoreColor(score)}`}
        />
      </svg>

      <div className="absolute text-center">
        <div className={`${textSizes[size]} font-headline font-bold ${getScoreColor(score)}`}>{score}</div>
        <span className="text-xs font-label uppercase tracking-widest text-secondary">{getScoreLabel(score)}</span>
      </div>
    </div>
  );
}
