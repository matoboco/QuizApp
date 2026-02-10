import { cn } from '@/lib/utils';

interface AutoSaveIndicatorProps {
  isSaving: boolean;
  isDirty: boolean;
  lastSaved: Date | null;
  error: string | null;
}

type SaveStatus = 'unsaved' | 'saving' | 'saved' | 'error';

function getStatus(props: AutoSaveIndicatorProps): SaveStatus {
  if (props.error) return 'error';
  if (props.isSaving) return 'saving';
  if (props.isDirty) return 'unsaved';
  return 'saved';
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

const statusConfig: Record<SaveStatus, { dotColor: string; label: string }> = {
  unsaved: { dotColor: 'bg-yellow-400', label: 'Unsaved changes' },
  saving: { dotColor: 'bg-blue-400', label: 'Saving...' },
  saved: { dotColor: 'bg-green-400', label: 'Saved' },
  error: { dotColor: 'bg-red-400', label: 'Error saving' },
};

export default function AutoSaveIndicator(props: AutoSaveIndicatorProps) {
  const status = getStatus(props);
  const config = statusConfig[status];

  const label =
    status === 'saved' && props.lastSaved
      ? `Saved at ${formatTime(props.lastSaved)}`
      : status === 'error' && props.error
        ? props.error
        : config.label;

  return (
    <div className="flex items-center gap-2 text-sm text-gray-400">
      <span
        className={cn(
          'inline-block w-2 h-2 rounded-full',
          config.dotColor,
          status === 'saving' && 'animate-pulse'
        )}
      />
      <span>{label}</span>
    </div>
  );
}
