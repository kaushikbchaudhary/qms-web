import { KeyboardEvent, forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useGrammarSuggestion } from '@/hooks/useGrammarSuggestion';

type GrammarInputProps = Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'value' | 'onChange'> & {
  value: string;
  onChange: (value: string) => void;
  showSuggestion?: boolean;
  debounceMs?: number;
};

export const GrammarInput = forwardRef<HTMLTextAreaElement, GrammarInputProps>(
  ({ value, onChange, showSuggestion = true, debounceMs = 600, className, maxLength = 5000, ...props }, ref) => {
    const { suggestion, completion, isLoading, clearSuggestion } = useGrammarSuggestion({
      value,
      enabled: showSuggestion,
      debounceMs,
      maxLength,
    });

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

    const ghostText =
      suggestion && completion
        ? (suggestion.toLowerCase().startsWith((value ?? '').toLowerCase()) ? value + completion : suggestion)
        : null;

    return (
      <div className="relative">
        {showSuggestion && ghostText && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 whitespace-pre-wrap rounded-md px-3 py-2 text-base leading-relaxed text-[#888]"
            style={{ opacity: 0.35 }}
          >
            {ghostText}
          </div>
        )}

        <Textarea
          {...props}
          ref={ref}
          value={value}
          maxLength={maxLength}
          onChange={(event) => {
            clearSuggestion();
            onChange(event.target.value);
          }}
          onKeyDown={handleKeyDown}
          className={cn('relative bg-transparent', className)}
        />

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
