import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface AnswerOption {
  id: string;
  text: string;
  orderIndex: number;
}

interface OrderingGridProps {
  answers: AnswerOption[];
  onSubmit: (answerIds: string[]) => void;
  submitted: boolean;
  disabled: boolean;
}

export default function OrderingGrid({
  answers,
  onSubmit,
  submitted,
  disabled,
}: OrderingGridProps) {
  // Shuffle answers on initial render (but keep stable across re-renders)
  const [items, setItems] = useState<AnswerOption[]>(() => {
    const shuffled = [...answers];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  });

  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const moveItem = useCallback((fromIndex: number, toIndex: number) => {
    if (submitted || disabled) return;
    setItems((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  }, [submitted, disabled]);

  const handleSubmit = () => {
    if (submitted || disabled) return;
    onSubmit(items.map((item) => item.id));
  };

  return (
    <div className="flex flex-col w-full h-full p-4">
      <p className="text-white/70 text-center text-sm font-display mb-3">
        Drag to reorder, then confirm
      </p>

      <div className="flex-1 flex flex-col gap-2 max-w-lg mx-auto w-full">
        {items.map((item, index) => (
          <div
            key={item.id}
            draggable={!submitted && !disabled}
            onDragStart={() => setDragIndex(index)}
            onDragOver={(e) => {
              e.preventDefault();
              if (dragIndex !== null && dragIndex !== index) {
                moveItem(dragIndex, index);
                setDragIndex(index);
              }
            }}
            onDragEnd={() => setDragIndex(null)}
            className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-xl transition-all',
              'bg-white/15 backdrop-blur-sm border border-white/20',
              !submitted && !disabled && 'cursor-grab active:cursor-grabbing hover:bg-white/25',
              submitted && 'cursor-default opacity-80',
              dragIndex === index && 'opacity-50 scale-95'
            )}
          >
            {/* Position number */}
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {index + 1}
            </div>

            {/* Item text */}
            <span className="flex-1 text-white font-display font-semibold text-base leading-snug">
              {item.text}
            </span>

            {/* Drag handle */}
            {!submitted && !disabled && (
              <svg className="w-5 h-5 text-white/40 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 8h16M4 16h16" />
              </svg>
            )}

            {/* Touch move buttons - larger for mobile usability */}
            {!submitted && !disabled && (
              <div className="flex flex-col gap-1 sm:hidden">
                <button
                  onClick={() => index > 0 && moveItem(index, index - 1)}
                  disabled={index === 0}
                  className="p-2 rounded-lg bg-white/20 text-white active:bg-white/40 disabled:opacity-30 disabled:active:bg-white/20 touch-manipulation"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                  </svg>
                </button>
                <button
                  onClick={() => index < items.length - 1 && moveItem(index, index + 1)}
                  disabled={index === items.length - 1}
                  className="p-2 rounded-lg bg-white/20 text-white active:bg-white/40 disabled:opacity-30 disabled:active:bg-white/20 touch-manipulation"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Submit button */}
      {!submitted && !disabled && (
        <div className="mt-4 flex justify-center">
          <button
            onClick={handleSubmit}
            className="px-8 py-3 rounded-xl font-display font-bold text-lg bg-white text-gray-900 hover:bg-gray-100 shadow-lg transition-all"
          >
            Confirm Order
          </button>
        </div>
      )}
    </div>
  );
}
