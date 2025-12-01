import { Fragment } from 'react';
import { Sparkles, Link2, History } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useContextSuggestion } from '@/hooks/useContextSuggestion';
import { ContextSuggestionResponse, SimilarIssue, SerialComplaint } from '@/lib/api/types/context';

export type SuggestionPick = {
  issue?: string;
  resolution?: string;
  rootCause?: string;
  capa?: string;
  source: 'serialMatch' | 'similarIssue' | 'recommended';
};

type ContextSuggestionProps = {
  text: string;
  onSelect: (pick: SuggestionPick) => void;
  disabled?: boolean;
  className?: string;
};

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
    {children}
  </div>
);

const SuggestionItem = ({
  title,
  description,
  onClick,
}: {
  title: string;
  description?: string;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className="w-full rounded-md border bg-card px-3 py-2 text-left text-sm shadow-sm transition hover:border-ring hover:bg-muted"
  >
    <div className="font-medium text-foreground">{title}</div>
    {description && <div className="text-xs text-muted-foreground">{description}</div>}
  </button>
);

const renderSerialMatches = (
  serialComplaints: SerialComplaint[],
  onSelect: (pick: SuggestionPick) => void,
) => {
  return serialComplaints.map((item) => (
    <SuggestionItem
      key={item.id}
      title={`${item.complaintNumber}: ${item.issue || 'Previous complaint'}`}
      description={[item.resolution, item.rootCause, item.capa].filter(Boolean).join(' • ')}
      onClick={() =>
        onSelect({
          issue: item.issue,
          resolution: item.resolution,
          rootCause: item.rootCause,
          capa: item.capa,
          source: 'serialMatch',
        })
      }
    />
  ));
};

const renderSimilarIssues = (issues: SimilarIssue[], onSelect: (pick: SuggestionPick) => void) => {
  return issues.map((issue, index) => (
    <SuggestionItem
      key={`${issue.issue}-${index}`}
      title={issue.issue || 'Similar issue'}
      description={[issue.resolution, issue.rootCause, issue.capa]
        .filter(Boolean)
        .slice(0, 2)
        .join(' • ')}
      onClick={() =>
        onSelect({
          issue: issue.issue,
          resolution: issue.resolution,
          rootCause: issue.rootCause,
          capa: issue.capa,
          source: 'similarIssue',
        })
      }
    />
  ));
};

export const ContextSuggestion = ({ text, onSelect, disabled, className }: ContextSuggestionProps) => {
  const { data, isLoading, error } = useContextSuggestion({ text, enabled: !disabled });

  const hasContent =
    (data?.serialMatch?.complaints?.length ?? 0) > 0 ||
    (data?.similarIssues?.length ?? 0) > 0 ||
    (data?.recommendedActions?.length ?? 0) > 0;

  if (disabled || (!isLoading && !hasContent && !error)) return null;

  return (
    <div className={cn('mt-2 space-y-3 rounded-lg border bg-background p-3 shadow-sm', className)}>
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Sparkles className="h-4 w-4 text-primary" />
        Context-aware suggestions
      </div>

      {isLoading && <div className="text-xs text-muted-foreground">Analyzing history…</div>}
      {error && <div className="text-xs text-destructive">{error}</div>}

      {data?.serialMatch?.complaints?.length ? (
        <div className="space-y-2">
          <SectionTitle>
            <History className="h-3 w-3" />
            Recent matches for {data.serialMatch.kit}
          </SectionTitle>
          <div className="space-y-2">
            {renderSerialMatches(data.serialMatch.complaints, onSelect)}
          </div>
        </div>
      ) : null}

      {data?.similarIssues?.length ? (
        <div className="space-y-2">
          <SectionTitle>
            <Link2 className="h-3 w-3" />
            Similar issues
          </SectionTitle>
          <div className="space-y-2">
            {renderSimilarIssues(data.similarIssues.slice(0, 5), onSelect)}
          </div>
        </div>
      ) : null}

      {data?.recommendedActions?.length ? (
        <div className="space-y-2">
          <SectionTitle>Recommended actions</SectionTitle>
          <div className="grid gap-2 sm:grid-cols-2">
            {data.recommendedActions.map((action) => (
              <SuggestionItem
                key={action}
                title={action}
                onClick={() =>
                  onSelect({
                    issue: undefined,
                    resolution: action,
                    source: 'recommended',
                  })
                }
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
};
