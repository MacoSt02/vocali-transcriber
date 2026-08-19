import { ChangeEvent, useEffect, useRef, useState } from 'react';
import NavBar from '../components/NavBar';
import {
  fetchTranscriptText,
  getDownloadUrl,
  getHistory,
  getUploadUrl,
  saveRealtimeTranscription,
  startTranscription,
  uploadAudioFile,
} from '../services/api';
import { TranscriptionStatus } from '../types/transcription';
import { useRealtimeTranscription } from '../hooks/useRealtimeTranscription';
import { useRealtimeLanguages } from '../hooks/useRealtimeLanguages';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

type FlowState = 'idle' | 'uploading' | 'processing' | 'completed' | 'failed' | 'error';
type Mode = 'file' | 'realtime';

const POLL_INTERVAL_MS = 3000;

export default function DashboardPage() {
  const [mode, setMode] = useState<Mode>('file');
  const [file, setFile] = useState<File | null>(null);
  const [state, setState] = useState<FlowState>('idle');
  const [transcriptionId, setTranscriptionId] = useState<string | null>(null);
  const [transcriptText, setTranscriptText] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (pollTimer.current) clearTimeout(pollTimer.current);
    };
  }, []);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] ?? null);
  };

  const resetResult = () => {
    setTranscriptionId(null);
    setTranscriptText(null);
    setErrorMessage(null);
  };

  const pollStatus = (id: string) => {
    pollTimer.current = setTimeout(async () => {
      try {
        const { items } = await getHistory();
        const item = items.find((t) => t.transcriptionId === id);
        const status: TranscriptionStatus | undefined = item?.status;

        if (status === 'COMPLETED') {
          const { downloadUrl } = await getDownloadUrl(id);
          const text = await fetchTranscriptText(downloadUrl);
          setTranscriptText(text);
          setState('completed');
          return;
        }

        if (status === 'FAILED') {
          setErrorMessage('La transcripción ha fallado. Inténtalo de nuevo con otro fichero.');
          setState('failed');
          return;
        }

        pollStatus(id);
      } catch (err) {
        setErrorMessage((err as Error).message);
        setState('error');
      }
    }, POLL_INTERVAL_MS);
  };

  const handleSubmit = async () => {
    if (!file) return;
    resetResult();
    setState('uploading');

    try {
      const { uploadUrl, key } = await getUploadUrl(file.type || 'audio/mpeg');
      await uploadAudioFile(uploadUrl, file);
      const { transcriptionId: id } = await startTranscription(key);
      setTranscriptionId(id);
      setState('processing');
      pollStatus(id);
    } catch (err) {
      setErrorMessage((err as Error).message);
      setState('error');
    }
  };

  const handleReset = () => {
    if (pollTimer.current) clearTimeout(pollTimer.current);
    setFile(null);
    setState('idle');
    resetResult();
  };

  const isBusy = state === 'uploading' || state === 'processing';

  const realtime = useRealtimeTranscription();
  const realtimeLanguages = useRealtimeLanguages();
  const [realtimeLanguage, setRealtimeLanguage] = useState('es');
  const [realtimeSaved, setRealtimeSaved] = useState(false);
  const [realtimeSaveError, setRealtimeSaveError] = useState<string | null>(null);

  const handleStopRealtime = async () => {
    await realtime.stop();
    if (!realtime.finalText.trim()) return;
    try {
      await saveRealtimeTranscription(realtime.finalText);
      setRealtimeSaved(true);
    } catch (err) {
      setRealtimeSaveError((err as Error).message);
    }
  };

  const handleStartRealtime = () => {
    setRealtimeSaved(false);
    setRealtimeSaveError(null);
    realtime.start(realtimeLanguage);
  };

  const handleModeChange = (nextMode: string) => {
    if (realtime.status === 'recording' || realtime.status === 'connecting') return;
    setMode(nextMode as Mode);
  };

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <div className="mx-auto max-w-2xl p-8">
        <h1 className="text-2xl font-semibold text-foreground">Transcribir audio</h1>

        <Tabs value={mode} onValueChange={handleModeChange} className="mt-6">
          <TabsList>
            <TabsTrigger value="file">Fichero</TabsTrigger>
            <TabsTrigger value="realtime">Tiempo real</TabsTrigger>
          </TabsList>

          <TabsContent value="file">
            <Card>
              <CardContent className="pt-6">
                <Label htmlFor="audio">Fichero de audio</Label>
                <Input
                  id="audio"
                  type="file"
                  accept="audio/*"
                  onChange={handleFileChange}
                  disabled={isBusy}
                  className="mt-2"
                />

                <Button onClick={handleSubmit} disabled={!file || isBusy} className="mt-4 w-full">
                  {state === 'uploading' && 'Subiendo audio...'}
                  {state === 'processing' && 'Transcribiendo...'}
                  {(state === 'idle' || state === 'completed' || state === 'failed' || state === 'error') &&
                    'Transcribir'}
                </Button>

                {state === 'processing' && (
                  <p className="mt-3 text-sm text-muted-foreground">
                    Esto puede tardar unos segundos o minutos según la duración del audio. No cierres esta pestaña.
                  </p>
                )}

                {(state === 'failed' || state === 'error') && errorMessage && (
                  <p className="mt-3 text-sm text-destructive">{errorMessage}</p>
                )}
              </CardContent>
            </Card>

            {state === 'completed' && transcriptText !== null && (
              <Card className="mt-6">
                <CardHeader className="flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-lg">Transcripción lista</CardTitle>
                  <Button variant="link" size="sm" onClick={handleReset}>
                    Transcribir otro audio
                  </Button>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap text-sm text-foreground">{transcriptText}</p>
                </CardContent>
              </Card>
            )}

            {transcriptionId && state !== 'idle' && (
              <p className="mt-4 text-xs text-muted-foreground">ID: {transcriptionId}</p>
            )}
          </TabsContent>

          <TabsContent value="realtime">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-lg font-semibold text-foreground">Grabación en directo</h2>
                  {realtime.status === 'idle' || realtime.status === 'error' ? (
                    <div className="flex items-center gap-2">
                      <Select value={realtimeLanguage} onValueChange={setRealtimeLanguage}>
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {realtimeLanguages.map((lang) => (
                            <SelectItem key={lang.code} value={lang.code}>
                              {lang.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button onClick={handleStartRealtime}>Empezar a grabar</Button>
                    </div>
                  ) : (
                    <Button
                      variant="destructive"
                      onClick={handleStopRealtime}
                      disabled={realtime.status === 'stopping' || realtime.status === 'connecting'}
                    >
                      {realtime.status === 'connecting' ? 'Conectando...' : 'Parar y guardar'}
                    </Button>
                  )}
                </div>

                {realtime.status === 'recording' && (
                  <p className="mt-3 flex items-center gap-2 text-sm text-destructive">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-destructive" /> Grabando...
                  </p>
                )}

                {realtime.errorMessage && <p className="mt-3 text-sm text-destructive">{realtime.errorMessage}</p>}

                {(realtime.finalText || realtime.partialText) && (
                  <p className="mt-4 whitespace-pre-wrap text-sm text-foreground">
                    {realtime.finalText}
                    <span className="text-muted-foreground">{realtime.partialText}</span>
                  </p>
                )}

                {realtimeSaved && (
                  <p className="mt-4 text-sm text-emerald-600">
                    Transcripción guardada. Puedes consultarla en el historial.
                  </p>
                )}
                {realtimeSaveError && (
                  <p className="mt-4 text-sm text-destructive">No se pudo guardar: {realtimeSaveError}</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
