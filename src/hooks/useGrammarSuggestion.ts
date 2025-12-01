import { useEffect, useMemo, useRef, useState } from 'react';
import { textApi } from '@/lib/api/endpoints/text';

type UseGrammarSuggestionOptions = {
  value: string;
  enabled?: boolean;
  debounceMs?: number;
  maxCacheEntries?: number;
  maxLength?: number;
  limit?: number;
};

type CacheEntry = {
  text: string;
  suggestion: string | null;
};

const normalizeInput = (value: string) => value.replace(/\s+/g, ' ').trim();

export const useGrammarSuggestion = ({
  value,
  enabled = true,
  debounceMs = 600,
  maxCacheEntries = 5,
  maxLength = 5000,
  limit = 3,
}: UseGrammarSuggestionOptions) => {
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastCheckedRef = useRef<string>('');
  const cacheRef = useRef<CacheEntry[]>([]);

  useEffect(() => {
    if (!enabled) {
      setSuggestion(null);
      return;
    }

    const cleaned = normalizeInput(value).slice(0, maxLength);
    if (!cleaned || cleaned.length < 5) {
      setSuggestion(null);
      lastCheckedRef.current = '';
      return;
    }

    if (cleaned === lastCheckedRef.current) {
      return;
    }

    const cached = cacheRef.current.find((entry) => entry.text === cleaned);
    if (cached) {
      setSuggestion(cached.suggestion && cached.suggestion !== cleaned ? cached.suggestion : null);
      lastCheckedRef.current = cleaned;
      return;
    }

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await textApi.correct(cleaned, { limit });
        if (response?.error) {
          setSuggestion(null);
          lastCheckedRef.current = cleaned;
          return;
        }

        const resolvedSuggestion =
          response?.suggested && response.suggested !== cleaned ? response.suggested : null;

        setSuggestion(resolvedSuggestion);
        lastCheckedRef.current = cleaned;

        cacheRef.current = [{ text: cleaned, suggestion: response?.suggested ?? null }, ...cacheRef.current]
          .slice(0, Math.max(1, maxCacheEntries));
      } catch (error) {
        setSuggestion(null);
        lastCheckedRef.current = cleaned;
      } finally {
        setIsLoading(false);
      }
    }, debounceMs);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [value, enabled, debounceMs, maxCacheEntries, maxLength]);

  const clearSuggestion = () => setSuggestion(null);

  const completion = useMemo(() => {
    if (!suggestion) return '';
    const base = value ?? '';
    if (suggestion.toLowerCase().startsWith(base.toLowerCase())) {
      return suggestion.slice(base.length);
    }
    return suggestion;
  }, [suggestion, value]);

  return {
    suggestion,
    completion,
    isLoading,
    clearSuggestion,
  };
};
