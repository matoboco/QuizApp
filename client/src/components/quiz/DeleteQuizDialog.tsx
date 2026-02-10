import React, { useEffect } from 'react';
import Button from '@/components/common/Button';

interface DeleteQuizDialogProps {
  isOpen: boolean;
  quizTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteQuizDialog({
  isOpen,
  quizTitle,
  onConfirm,
  onCancel,
}: DeleteQuizDialogProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        onCancel();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="relative bg-cyber-card border border-primary-500/20 rounded-xl shadow-2xl p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-display font-bold text-gray-100">
          Delete Quiz
        </h3>

        <p className="mt-3 text-gray-400">
          Are you sure you want to delete{' '}
          <span className="font-semibold text-gray-100">"{quizTitle}"</span>?
          This action cannot be undone.
        </p>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}
