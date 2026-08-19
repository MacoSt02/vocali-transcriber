import { render, screen } from '@testing-library/react';
import StatusBadge from './StatusBadge';
import { TranscriptionStatus } from '../types/transcription';

describe('StatusBadge', () => {
  const cases: [TranscriptionStatus, string][] = [
    ['PENDING', 'Pendiente'],
    ['PROCESSING', 'Procesando'],
    ['COMPLETED', 'Completada'],
    ['FAILED', 'Fallida'],
  ];

  it.each(cases)('muestra la etiqueta correcta para %s', (status, label) => {
    render(<StatusBadge status={status} />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });
});
