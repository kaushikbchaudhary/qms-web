import { useEffect, useRef, useState } from 'react';
import { contextApi } from '@/lib/api/endpoints/context';
import { ContextSuggestionResponse, SimilarIssue } from '@/lib/api/types/context';

type UseContextSuggestionOptions = {
  text: string;
  enabled?: boolean;
  debounceMs?: number;
  minLength?: number;
};

export const useContextSuggestion = ({
  text,
  enabled = true,
  debounceMs = 700,
  minLength = 5,
}: UseContextSuggestionOptions) => {
  const [data, setData] = useState<ContextSuggestionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTextRef = useRef<string>('');

  useEffect(() => {
    const cleaned = text.replace(/\s+/g, ' ').trim();

    if (!enabled) {
      setData(null);
      return;
    }

    if (!cleaned || cleaned.length < minLength) {
      setData(null);
      lastTextRef.current = '';
      return;
    }

    if (cleaned === lastTextRef.current) return;

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await contextApi.suggest(cleaned);
        setData(response);
        lastTextRef.current = cleaned;
      } catch (err) {
        setError('Unable to fetch suggestions');
        setData(null);
      } finally {
        setIsLoading(false);
      }
    }, debounceMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [text, enabled, debounceMs, minLength]);

  const bestSimilar = (data?.similarIssues ?? []).filter((item: SimilarIssue) => item.issue);

  return { data, isLoading, error, bestSimilar };
};
