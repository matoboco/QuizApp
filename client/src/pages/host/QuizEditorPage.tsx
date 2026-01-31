import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuizEditor } from '@/hooks/useQuizEditor';
import { useAutoSave } from '@/hooks/useAutoSave';
import QuizSettingsForm from '@/components/editor/QuizSettingsForm';
import QuestionList from '@/components/editor/QuestionList';
import QuestionEditor from '@/components/editor/QuestionEditor';
import AutoSaveIndicator from '@/components/editor/AutoSaveIndicator';
import Button from '@/components/common/Button';
import LoadingSpinner from '@/components/common/LoadingSpinner';

export default function QuizEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);

  const editor = useQuizEditor(id!);
  const autoSave = useAutoSave(editor.save, editor.isDirty);

  // Loading state
  if (editor.isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-500">Loading quiz...</p>
        </div>
      </div>
    );
  }

  // Error state (failed to load)
  if (editor.error && !editor.quiz) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-display font-bold text-gray-800">Failed to load quiz</h2>
          <p className="mt-2 text-gray-500">{editor.error}</p>
          <Button
            variant="primary"
            className="mt-4"
            onClick={() => navigate('/dashboard')}
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (!editor.quiz) return null;

  const { quiz } = editor;
  const activeQuestion = quiz.questions[activeQuestionIndex] || null;

  // Ensure activeQuestionIndex is valid after deletions
  const safeActiveIndex = Math.min(activeQuestionIndex, quiz.questions.length - 1);
  if (safeActiveIndex !== activeQuestionIndex && safeActiveIndex >= 0) {
    setActiveQuestionIndex(safeActiveIndex);
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Back to dashboard"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div className="h-6 w-px bg-gray-300" />
          <AutoSaveIndicator
            isSaving={autoSave.isSaving}
            isDirty={editor.isDirty}
            lastSaved={autoSave.lastSaved}
            error={autoSave.saveError}
          />
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={autoSave.saveNow}
          isLoading={autoSave.isSaving}
          disabled={!editor.isDirty && !autoSave.isSaving}
        >
          Save Now
        </Button>
      </div>

      {/* Quiz settings */}
      <div className="px-4 py-4 bg-white border-b border-gray-200">
        <QuizSettingsForm
          title={quiz.title}
          description={quiz.description}
          isPublished={quiz.isPublished}
          onTitleChange={editor.updateTitle}
          onDescriptionChange={editor.updateDescription}
          onPublishedChange={editor.updatePublished}
        />
      </div>

      {/* Main content: sidebar + editor */}
      <div className="flex flex-1 overflow-hidden">
        {/* Question list sidebar */}
        <div className="w-72 flex-shrink-0 bg-white border-r border-gray-200 overflow-hidden">
          <QuestionList
            questions={quiz.questions}
            activeIndex={activeQuestionIndex}
            validationErrors={editor.validationErrors}
            onSelect={setActiveQuestionIndex}
            onAdd={() => {
              editor.addQuestion();
              setActiveQuestionIndex(quiz.questions.length);
            }}
            onRemove={(index) => {
              editor.removeQuestion(index);
              if (activeQuestionIndex >= quiz.questions.length - 1) {
                setActiveQuestionIndex(Math.max(0, quiz.questions.length - 2));
              }
            }}
            onMove={(from, to) => {
              editor.moveQuestion(from, to);
              if (activeQuestionIndex === from) {
                setActiveQuestionIndex(to);
              }
            }}
          />
        </div>

        {/* Question editor area */}
        <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
          {activeQuestion ? (
            <div className="max-w-3xl mx-auto">
              <div className="mb-4">
                <span className="text-sm font-medium text-gray-500">
                  Question {activeQuestionIndex + 1} of {quiz.questions.length}
                </span>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <QuestionEditor
                  question={activeQuestion}
                  errors={editor.validationErrors[activeQuestionIndex]}
                  onChange={(data) => editor.updateQuestion(activeQuestionIndex, data)}
                  onChangeType={(type) => editor.changeQuestionType(activeQuestionIndex, type)}
                  onAnswerChange={(answerIndex, data) =>
                    editor.updateAnswer(activeQuestionIndex, answerIndex, data)
                  }
                  onAddAnswer={() => editor.addAnswer(activeQuestionIndex)}
                  onRemoveAnswer={(answerIndex) =>
                    editor.removeAnswer(activeQuestionIndex, answerIndex)
                  }
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-display font-bold text-gray-800">
                  Add your first question
                </h3>
                <p className="mt-1 text-gray-500 text-sm">
                  Click the button below to get started
                </p>
                <Button
                  variant="primary"
                  className="mt-4"
                  onClick={() => {
                    editor.addQuestion();
                    setActiveQuestionIndex(0);
                  }}
                >
                  <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  Add Question
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
