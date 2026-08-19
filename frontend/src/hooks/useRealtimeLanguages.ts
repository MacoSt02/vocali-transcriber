import { useEffect, useState } from 'react';
import axios from 'axios';

export interface LanguageOption {
  code: string;
  label: string;
}

const DISCOVERY_URL = 'https://eu2.rt.speechmatics.com/v1/discovery/features';

const FALLBACK_LANGUAGES: LanguageOption[] = [
  { code: 'es', label: 'Español' },
  { code: 'en', label: 'Inglés' },
  { code: 'fr', label: 'Francés' },
  { code: 'de', label: 'Alemán' },
  { code: 'it', label: 'Italiano' },
  { code: 'pt', label: 'Portugués' },
];

interface DiscoveryResponse {
  metadata?: { language_pack_info?: Record<string, { language_description?: string }> };
  realtime?: { transcription?: [{ languages?: string[] }] };
}

export function useRealtimeLanguages(): LanguageOption[] {
  const [languages, setLanguages] = useState<LanguageOption[]>(FALLBACK_LANGUAGES);

  useEffect(() => {
    let cancelled = false;

    axios
      .get<DiscoveryResponse>(DISCOVERY_URL)
      .then(({ data }) => {
        const codes = data.realtime?.transcription?.[0]?.languages ?? [];
        const packInfo = data.metadata?.language_pack_info ?? {};
        const options = codes
          .map((code) => ({ code, label: packInfo[code]?.language_description ?? code }))
          .sort((a, b) => a.label.localeCompare(b.label, 'es'));

        if (!cancelled && options.length > 0) setLanguages(options);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  return languages;
}
