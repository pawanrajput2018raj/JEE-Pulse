export function formatDigitalTime(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function formatTimeWithHours(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function formatHumanDuration(totalSeconds: number): string {
  if (totalSeconds < 60) {
    return `${totalSeconds}s`;
  }
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  if (secs === 0) {
    return `${mins}m`;
  }
  return `${mins}m ${secs}s`;
}

export function getPaceInfo(seconds: number) {
  if (seconds <= 75) {
    return {
      label: '⚡ Rapid Pace',
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      textColor: 'text-emerald-600',
    };
  }
  if (seconds <= 150) {
    return {
      label: '🎯 Target JEE Pace',
      color: 'bg-sky-50 text-sky-700 border-sky-200',
      textColor: 'text-sky-600',
    };
  }
  return {
    label: '⏱️ Deep / Multi-concept',
    color: 'bg-amber-50 text-amber-700 border-amber-200',
    textColor: 'text-amber-600',
  };
}
