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
            onChange(event.target.value);
          }}
          onKeyDown={handleKeyDown}
          className={cn('relative z-10 bg-transparent', className)}
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
