import { cn } from '@/lib/utils';

interface QuizSettingsFormProps {
  title: string;
  description: string;
  isPublished: boolean;
  readOnly?: boolean;
  onTitleChange: (title: string) => void;
  onDescriptionChange: (description: string) => void;
  onPublishedChange: (isPublished: boolean) => void;
}

export default function QuizSettingsForm({
  title,
  description,
  isPublished,
  readOnly,
  onTitleChange,
  onDescriptionChange,
  onPublishedChange,
}: QuizSettingsFormProps) {
  return (
    <div className="space-y-4">
      <div>
        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Enter quiz title..."
          readOnly={readOnly}
          className={cn(
            'w-full text-2xl font-display font-bold text-gray-100 border-0 border-b-2 border-primary-500/20 focus:border-primary-400 focus:ring-0 bg-transparent pb-2 outline-none placeholder-gray-500',
            readOnly && 'cursor-default opacity-70'
          )}
        />
      </div>

      <div>
        <textarea
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Add a description (optional)..."
          rows={2}
          readOnly={readOnly}
          className={cn(
            'w-full text-gray-300 border rounded-lg border-primary-500/20 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 bg-cyber-surface px-3 py-2 outline-none resize-none placeholder-gray-500 text-sm',
            readOnly && 'cursor-default opacity-70'
          )}
        />
      </div>

      {!readOnly && (
        <div className="flex items-center gap-3">
          <button
            type="button"
            role="switch"
            aria-checked={isPublished}
            onClick={() => onPublishedChange(!isPublished)}
            className={cn(
              'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
              isPublished ? 'bg-primary-500' : 'bg-gray-600'
            )}
          >
            <span
              className={cn(
                'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                isPublished ? 'translate-x-5' : 'translate-x-0'
              )}
            />
          </button>
          <span className="text-sm font-medium text-gray-300">
            {isPublished ? 'Public' : 'Private'}
          </span>
        </div>
      )}

      {readOnly && (
        <div className="flex items-center gap-2">
          <span className={cn(
            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
            isPublished ? 'bg-neon-green/20 text-neon-green' : 'bg-gray-500/20 text-gray-400'
          )}>
            {isPublished ? 'Public' : 'Private'}
          </span>
        </div>
      )}
    </div>
  );
}
