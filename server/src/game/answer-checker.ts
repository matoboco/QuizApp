import { Question } from '@shared/types';

export interface AnswerCheckResult {
  isCorrect: boolean;
  correctRatio: number; // 0.0 - 1.0
}

/**
 * Check a player's submitted answer(s) against the question's correct answers.
 * Returns isCorrect (fully correct) and correctRatio (0.0-1.0 for partial credit).
 */
export function checkAnswer(
  question: Question,
  submittedAnswer: string | string[]
): AnswerCheckResult {
  switch (question.questionType) {
    case 'true-false':
    case 'multiple-choice':
      return checkSingleAnswer(question, submittedAnswer as string);

    case 'multi-select':
      return checkMultiSelect(question, submittedAnswer as string[], question.requireAll);

    case 'ordering':
      return checkOrdering(question, submittedAnswer as string[]);

    case 'number-guess':
      return checkNumberGuess(question, submittedAnswer as string);

    default:
      return checkSingleAnswer(question, submittedAnswer as string);
  }
}

function checkSingleAnswer(question: Question, answerId: string): AnswerCheckResult {
  const correctAnswer = question.answers.find((a) => a.isCorrect);
  const isCorrect = correctAnswer?.id === answerId;
  return {
    isCorrect,
    correctRatio: isCorrect ? 1.0 : 0.0,
  };
}

function checkMultiSelect(
  question: Question,
  selectedIds: string[],
  requireAll: boolean
): AnswerCheckResult {
  const correctIds = new Set(question.answers.filter((a) => a.isCorrect).map((a) => a.id));
  const selectedSet = new Set(selectedIds);

  if (requireAll) {
    // Must select exactly the correct answers - all or nothing
    const allCorrectSelected = [...correctIds].every((id) => selectedSet.has(id));
    const noIncorrectSelected = [...selectedSet].every((id) => correctIds.has(id));
    const isCorrect = allCorrectSelected && noIncorrectSelected;
    return {
      isCorrect,
      correctRatio: isCorrect ? 1.0 : 0.0,
    };
  }

  // Partial credit: (correctlySelected - incorrectlySelected) / totalCorrect
  const totalCorrect = correctIds.size;
  if (totalCorrect === 0) return { isCorrect: false, correctRatio: 0 };

  let correctlySelected = 0;
  let incorrectlySelected = 0;

  for (const id of selectedSet) {
    if (correctIds.has(id)) {
      correctlySelected++;
    } else {
      incorrectlySelected++;
    }
  }

  const ratio = Math.max(0, (correctlySelected - incorrectlySelected) / totalCorrect);
  return {
    isCorrect: ratio >= 1.0,
    correctRatio: Math.min(1.0, ratio),
  };
}

function checkNumberGuess(question: Question, submittedAnswer: string): AnswerCheckResult {
  const submitted = parseFloat(submittedAnswer);
  if (isNaN(submitted)) return { isCorrect: false, correctRatio: 0 };

  const distance = Math.abs(submitted - question.correctNumber!);
  if (distance === 0) return { isCorrect: true, correctRatio: 1.0 };
  if (distance >= question.tolerance!) return { isCorrect: false, correctRatio: 0 };

  return { isCorrect: false, correctRatio: 1 - distance / question.tolerance! };
}

function checkOrdering(question: Question, submittedOrder: string[]): AnswerCheckResult {
  // The correct order is defined by the answers' orderIndex (sorted ascending)
  const correctOrder = [...question.answers]
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .map((a) => a.id);

  if (submittedOrder.length !== correctOrder.length) {
    return { isCorrect: false, correctRatio: 0 };
  }

  let correctPositions = 0;
  for (let i = 0; i < correctOrder.length; i++) {
    if (submittedOrder[i] === correctOrder[i]) {
      correctPositions++;
    }
  }

  const ratio = correctPositions / correctOrder.length;
  return {
    isCorrect: ratio >= 1.0,
    correctRatio: ratio,
  };
}
