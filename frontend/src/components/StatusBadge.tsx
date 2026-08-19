import { Badge } from '@/components/ui/badge';
import { TranscriptionStatus } from '../types/transcription';

const STATUS_VARIANTS: Record<TranscriptionStatus, 'secondary' | 'default' | 'destructive' | 'outline'> = {
  PENDING: 'secondary',
  PROCESSING: 'outline',
  COMPLETED: 'default',
  FAILED: 'destructive',
};

const STATUS_LABELS: Record<TranscriptionStatus, string> = {
  PENDING: 'Pendiente',
  PROCESSING: 'Procesando',
  COMPLETED: 'Completada',
  FAILED: 'Fallida',
};

export default function StatusBadge({ status }: { status: TranscriptionStatus }) {
  return <Badge variant={STATUS_VARIANTS[status]}>{STATUS_LABELS[status]}</Badge>;
}

export { STATUS_LABELS };
