import React, { useRef, useState } from 'react';
import Button from '@/components/common/Button';
import Modal from '@/components/common/Modal';
import { parseQuizTxt, type ParsedQuiz, type ParseError } from '@/lib/quizTxt';

interface ImportQuizButtonProps {
  onImport: (data: ParsedQuiz) => Promise<void>;
}

export default function ImportQuizButton({ onImport }: ImportQuizButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [errors, setErrors] = useState<ParseError[]>([]);
  const [showErrors, setShowErrors] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so the same file can be selected again
    e.target.value = '';

    const text = await file.text();
    const result = parseQuizTxt(text);

    if (!result.ok) {
      setErrors(result.errors);
      setShowErrors(true);
      return;
    }

    try {
      setIsImporting(true);
      await onImport(result.data);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <>
      <Button
        variant="secondary"
        size="sm"
        onClick={handleClick}
        isLoading={isImporting}
        className="flex items-center gap-1.5"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
          />
        </svg>
        Import
      </Button>

      <input
        ref={inputRef}
        type="file"
        accept=".quiz.txt,.txt"
        className="hidden"
        onChange={handleFileChange}
      />

      <Modal
        isOpen={showErrors}
        onClose={() => setShowErrors(false)}
        title="Import errors"
        footer={
          <Button variant="secondary" size="sm" onClick={() => setShowErrors(false)}>
            Close
          </Button>
        }
      >
        <p className="mb-3 text-sm text-gray-600">
          The file could not be imported due to the following errors:
        </p>
        <ul className="max-h-60 overflow-y-auto space-y-1">
          {errors.map((err, i) => (
            <li key={i} className="text-sm">
              <span className="font-mono text-red-600">Line {err.line}:</span>{' '}
              <span className="text-gray-700">{err.message}</span>
            </li>
          ))}
        </ul>
      </Modal>
    </>
  );
}
