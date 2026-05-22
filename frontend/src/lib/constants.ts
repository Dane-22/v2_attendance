// Worker position classification (UI-only routing in v1)
// Backend validation does not depend on this classification

export const WORKER_POSITIONS = [
  'Worker',
  'Laborer', 
  'Foreman',
  'Skilled Worker',
  'Helper',
  'Construction Worker',
  'Site Worker'
] as const;

export type WorkerPosition = typeof WORKER_POSITIONS[number];

export const isWorkerPosition = (position: string | null): boolean => {
  return position ? WORKER_POSITIONS.includes(position as WorkerPosition) : false;
};
