import React from 'react';

interface CreateQuizFabProps {
  onClick: () => void;
}

export default function CreateQuizFab({ onClick }: CreateQuizFabProps) {
  return (
    <button
      onClick={onClick}
      title="Create new quiz"
      className="fixed bottom-8 right-8 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary-600 text-white shadow-lg transition-all duration-200 hover:bg-primary-700 hover:shadow-xl hover:scale-105 focus:outline-none focus:ring-4 focus:ring-primary-300 active:scale-95"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-7 w-7"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2.5}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
      </svg>
      <span className="sr-only">Create new quiz</span>
    </button>
  );
}
