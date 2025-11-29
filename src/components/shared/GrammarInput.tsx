import { KeyboardEvent, forwardRef, useMemo, useState } from 'react';
import { Loader2, Wand2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useGrammarSuggestion } from '@/hooks/useGrammarSuggestion';
import { textApi } from '@/lib/api/endpoints/text';

type GrammarInputProps = Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'value' | 'onChange'> & {
  value: string;
  onChange: (value: string) => void;
  showSuggestion?: boolean;
  enableSuggestionButton?: boolean;
  debounceMs?: number;
};

export const GrammarInput = forwardRef<HTMLTextAreaElement, GrammarInputProps>(
  (
    {
      value,
      onChange,
      showSuggestion = false,
      enableSuggestionButton = true,
      debounceMs = 600,
      className,
      maxLength = 5000,
      ...props
    },
    ref,
  ) => {
    const { suggestion, completion, isLoading, clearSuggestion } = useGrammarSuggestion({
      value,
      enabled: showSuggestion,
      debounceMs,
      maxLength,
    });
    const [choices, setChoices] = useState<string[]>([]);
    const [isFetchingChoices, setIsFetchingChoices] = useState(false);
    const [choicesError, setChoicesError] = useState<string | null>(null);

    const trimmed = useMemo(() => (value ?? '').trim(), [value]);

    const fetchChoices = async () => {
      const cleaned = trimmed.replace(/\s+/g, ' ');
      if (!cleaned || cleaned.length < 5) {
        setChoices([]);
        return;
      }
      setIsFetchingChoices(true);
      setChoicesError(null);
      try {
        const response = await textApi.correct(cleaned, { limit: 3 });
        const list = response?.suggestions?.length
          ? response.suggestions
          : response?.suggested
            ? [response.suggested]
            : [];
        const unique = Array.from(new Set(list.filter(Boolean))).slice(0, 3);
        setChoices(unique);
      } catch (error) {
        setChoices([]);
        setChoicesError('Unable to fetch suggestions right now.');
      } finally {
        setIsFetchingChoices(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
      if (!suggestion) return;

      if (event.key === 'Tab' || event.key === 'Enter') {
        event.preventDefault();
        onChange(suggestion);
        clearSuggestion();
      } else if (event.key === 'Escape') {
        event.preventDefault();
        clearSuggestion();
      } else if (event.key === 'Backspace') {
        clearSuggestion();
      }
    };

    return (
      <div className="relative">
        {showSuggestion && suggestion && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-20 overflow-hidden rounded-md"
            style={{ fontFamily: 'inherit', fontSize: 'inherit', lineHeight: 'inherit' }}
          >
            <div className="whitespace-pre-wrap break-words px-3 py-2">
              {completion ? (
                <>
                  <span className="text-transparent">{value}</span>
                  <span className="text-[#888]" style={{ opacity: 0.45 }}>
                    {completion}
                  </span>
                </>
              ) : (
                <span className="text-[#888]" style={{ opacity: 0.45 }}>
                  {suggestion}
                </span>
              )}
            </div>
          </div>
        )}

        <Textarea
          {...props}
          ref={ref}
          value={value}
          maxLength={maxLength}
          onChange={(event) => {
            clearSuggestion();
            setChoices([]);
            onChange(event.target.value);
          }}
          onKeyDown={handleKeyDown}
          className={cn('relative z-10 bg-transparent', className)}
        />

        {enableSuggestionButton && trimmed.length >= 5 && (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-md border px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm transition hover:border-ring hover:text-foreground"
              onClick={fetchChoices}
              disabled={isFetchingChoices}
            >
              <Wand2 className="h-4 w-4" />
              {isFetchingChoices ? 'Fetching...' : 'See suggestions'}
            </button>
            {choicesError && <span className="text-xs text-destructive">{choicesError}</span>}
          </div>
        )}

        {choices.length > 0 && (
          <div className="mt-2 overflow-hidden rounded-md border bg-card text-sm shadow-sm">
            {choices.map((choice, index) => (
              <button
                key={index}
                type="button"
                className="flex w-full items-start gap-2 px-3 py-2 text-left hover:bg-muted"
                onClick={() => {
                  onChange(choice);
                  clearSuggestion();
                  setChoices([]);
                }}
              >
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
                <span>{choice}</span>
              </button>
            ))}
          </div>
        )}

        {isLoading && (
          <div className="pointer-events-none absolute bottom-2 right-2 flex items-center gap-1 rounded bg-background/80 px-2 py-0.5 text-[10px] text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>checking</span>
          </div>
        )}
      </div>
    );
  },
);

GrammarInput.displayName = 'GrammarInput';
