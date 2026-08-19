import { useCallback, useRef, useState } from 'react';
import { RealtimeClient } from '@speechmatics/real-time-client';
import { PCMRecorder } from '@speechmatics/browser-audio-input';
import workletScriptURL from '@speechmatics/browser-audio-input/pcm-audio-worklet.min.js?url';
import { getRealtimeToken } from '../services/api';

export type RealtimeStatus = 'idle' | 'connecting' | 'recording' | 'stopping' | 'error';

function floatTo16BitPCM(input: Float32Array): ArrayBuffer {
  const buffer = new ArrayBuffer(input.length * 2);
  const view = new DataView(buffer);
  for (let i = 0; i < input.length; i++) {
    const s = Math.max(-1, Math.min(1, input[i]));
    view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return buffer;
}

export function useRealtimeTranscription() {
  const [status, setStatus] = useState<RealtimeStatus>('idle');
  const [partialText, setPartialText] = useState('');
  const [finalText, setFinalText] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const clientRef = useRef<RealtimeClient | null>(null);
  const recorderRef = useRef<PCMRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const cleanup = useCallback(() => {
    recorderRef.current?.stopRecording();
    recorderRef.current = null;
    audioContextRef.current?.close();
    audioContextRef.current = null;
    clientRef.current = null;
  }, []);

  const start = useCallback(async (language: string) => {
    setErrorMessage(null);
    setPartialText('');
    setFinalText('');
    setStatus('connecting');

    try {
      const { token } = await getRealtimeToken();

      const client = new RealtimeClient();
      client.addEventListener('receiveMessage', ({ data }) => {
        if (data.message === 'AddTranscript') {
          setFinalText((prev) => `${prev}${data.metadata.transcript}`);
          setPartialText('');
        } else if (data.message === 'AddPartialTranscript') {
          setPartialText(data.metadata.transcript);
        }
      });

      const audioContext = new AudioContext();
      const recorder = new PCMRecorder(workletScriptURL);
      recorder.addEventListener('audio', (event) => {
        client.sendAudio(floatTo16BitPCM(event.data));
      });

      await client.start(token, {
        transcription_config: { language, max_delay: 0.7, enable_partials: true },
        audio_format: { type: 'raw', encoding: 'pcm_s16le', sample_rate: audioContext.sampleRate },
      });
      await recorder.startRecording({ audioContext });

      clientRef.current = client;
      recorderRef.current = recorder;
      audioContextRef.current = audioContext;
      setStatus('recording');
    } catch (err) {
      cleanup();
      setErrorMessage((err as Error).message);
      setStatus('error');
    }
  }, [cleanup]);

  const stop = useCallback(async () => {
    if (!clientRef.current) return;
    setStatus('stopping');
    try {
      recorderRef.current?.stopRecording();
      await clientRef.current.stopRecognition({ noTimeout: true });
    } catch (err) {
      setErrorMessage((err as Error).message);
    } finally {
      cleanup();
      setStatus('idle');
    }
  }, [cleanup]);

  return { status, partialText, finalText, errorMessage, start, stop };
}
