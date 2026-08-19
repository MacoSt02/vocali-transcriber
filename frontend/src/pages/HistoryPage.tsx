import { useEffect, useState } from 'react';
import NavBar from '../components/NavBar';
import StatusBadge, { STATUS_LABELS } from '../components/StatusBadge';
import { fetchTranscriptText, getDownloadUrl, getHistory } from '../services/api';
import { downloadTextFile } from '../lib/download';
import { Transcription } from '../types/transcription';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function HistoryPage() {
  const [items, setItems] = useState<Transcription[]>([]);
  const [cursorStack, setCursorStack] = useState<(string | undefined)[]>([undefined]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const [selectedItem, setSelectedItem] = useState<Transcription | null>(null);
  const [modalText, setModalText] = useState<string | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const page = cursorStack.length - 1;
  const currentCursor = cursorStack[page];

  const loadPage = async (cursor?: string) => {
    setLoading(true);
    setError(null);
    try {
      const { items: pageItems, nextCursor: cursorForNext } = await getHistory(cursor);
      setItems(pageItems);
      setNextCursor(cursorForNext);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPage(currentCursor);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleNext = () => {
    if (!nextCursor) return;
    setCursorStack((stack) => [...stack, nextCursor]);
  };

  const handlePrev = () => {
    if (page === 0) return;
    setCursorStack((stack) => stack.slice(0, -1));
  };

  const handleView = async (item: Transcription) => {
    setSelectedItem(item);
    setModalText(null);
    setModalError(null);
    setModalLoading(true);
    try {
      const { downloadUrl } = await getDownloadUrl(item.transcriptionId);
      const text = await fetchTranscriptText(downloadUrl);
      setModalText(text);
    } catch (err) {
      setModalError('No se ha podido cargar la transcripción. Puede que aún no esté lista.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDownload = async (item: Transcription) => {
    setDownloadingId(item.transcriptionId);
    setError(null);
    try {
      const { downloadUrl } = await getDownloadUrl(item.transcriptionId);
      const text = await fetchTranscriptText(downloadUrl);
      downloadTextFile(`transcripcion-${item.transcriptionId}.txt`, text);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setDownloadingId(null);
    }
  };

  const closeModal = (open: boolean) => {
    if (open) return;
    setSelectedItem(null);
    setModalText(null);
    setModalError(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <div className="mx-auto max-w-4xl p-8">
        <h1 className="text-2xl font-semibold text-foreground">Historial de transcripciones</h1>

        <Card className="mt-6 overflow-hidden">
          <CardContent className="p-0">
            {loading ? (
              <p className="p-6 text-sm text-muted-foreground">Cargando...</p>
            ) : items.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground">Todavía no has transcrito ningún audio.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.transcriptionId}>
                      <TableCell>{new Date(item.createdAt).toLocaleString()}</TableCell>
                      <TableCell>{item.type === 'FILE' ? 'Fichero' : 'Tiempo real'}</TableCell>
                      <TableCell>
                        <StatusBadge status={item.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="link"
                          size="sm"
                          onClick={() => handleView(item)}
                          disabled={item.status !== 'COMPLETED'}
                        >
                          Ver
                        </Button>
                        <Button
                          variant="link"
                          size="sm"
                          onClick={() => handleDownload(item)}
                          disabled={item.status !== 'COMPLETED' || downloadingId === item.transcriptionId}
                        >
                          {downloadingId === item.transcriptionId ? 'Descargando...' : 'Descargar'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

        {!loading && (items.length > 0 || page > 0) && (
          <div className="mt-4 flex items-center justify-between">
            <Button variant="secondary" size="sm" onClick={handlePrev} disabled={page === 0}>
              Anterior
            </Button>
            <span className="text-xs text-muted-foreground">Página {page + 1}</span>
            <Button variant="secondary" size="sm" onClick={handleNext} disabled={!nextCursor}>
              Siguiente
            </Button>
          </div>
        )}
      </div>

      <Dialog open={selectedItem !== null} onOpenChange={closeModal}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          {selectedItem && (
            <>
              <DialogHeader>
                <DialogTitle>Detalle de la transcripción</DialogTitle>
                <dl className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-muted-foreground">
                  <div>
                    <dt className="inline font-medium text-muted-foreground">Fecha:</dt>{' '}
                    <dd className="inline">{new Date(selectedItem.createdAt).toLocaleString()}</dd>
                  </div>
                  <div>
                    <dt className="inline font-medium text-muted-foreground">Tipo:</dt>{' '}
                    <dd className="inline">{selectedItem.type === 'FILE' ? 'Fichero' : 'Tiempo real'}</dd>
                  </div>
                  <div>
                    <dt className="inline font-medium text-muted-foreground">Estado:</dt>{' '}
                    <dd className="inline">{STATUS_LABELS[selectedItem.status]}</dd>
                  </div>
                  <div>
                    <dt className="inline font-medium text-muted-foreground">ID:</dt>{' '}
                    <dd className="inline">{selectedItem.transcriptionId}</dd>
                  </div>
                </dl>
              </DialogHeader>

              <div className="text-left">
                {modalLoading && <p className="text-sm text-muted-foreground">Cargando transcripción...</p>}
                {modalError && <p className="text-sm text-destructive">{modalError}</p>}
                {modalText !== null && <p className="whitespace-pre-wrap text-sm text-foreground">{modalText}</p>}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
