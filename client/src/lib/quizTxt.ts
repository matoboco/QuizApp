import type { Quiz, CreateQuestionInput, CreateAnswerInput, QuestionType } from '@shared/types/quiz';
import { DEFAULT_TIME_LIMIT, DEFAULT_POINTS } from '@shared/types/quiz';

// ── Types ──────────────────────────────────────────────────────────────

export interface ParsedQuiz {
  title: string;
  description?: string;
  questions: CreateQuestionInput[];
}

export interface ParseError {
  line: number;
  message: string;
}

export type ParseResult =
  | { ok: true; data: ParsedQuiz }
  | { ok: false; errors: ParseError[] };

// ── Serializer ─────────────────────────────────────────────────────────

export function serializeQuizTxt(quiz: Quiz): string {
  const lines: string[] = [];

  lines.push(`# ${quiz.title}`);
  if (quiz.description) {
    lines.push(`> ${quiz.description}`);
  }
  lines.push('');

  const sorted = [...quiz.questions].sort((a, b) => a.orderIndex - b.orderIndex);

  for (const q of sorted) {
    lines.push(`## ${q.text}`);
    if (q.description) {
      lines.push(`>> ${q.description}`);
    }
    lines.push(`type: ${q.questionType}`);
    if (q.timeLimit !== DEFAULT_TIME_LIMIT) {
      lines.push(`time: ${q.timeLimit}`);
    }
    if (q.points !== DEFAULT_POINTS) {
      lines.push(`points: ${q.points}`);
    }
    if (q.questionType === 'multi-select' && q.requireAll) {
      lines.push('requireAll: true');
    }

    if (q.questionType === 'number-guess') {
      if (q.correctNumber !== undefined) {
        lines.push(`answer: ${q.correctNumber}`);
      }
      if (q.tolerance !== undefined) {
        lines.push(`tolerance: ${q.tolerance}`);
      }
    } else {
      const sortedAnswers = [...q.answers].sort((a, b) => a.orderIndex - b.orderIndex);

      for (const a of sortedAnswers) {
        if (q.questionType === 'ordering') {
          lines.push(`${a.orderIndex + 1}. ${a.text}`);
        } else if (a.isCorrect) {
          lines.push(`* ${a.text}`);
        } else {
          lines.push(`- ${a.text}`);
        }
      }
    }

    lines.push('');
  }

  return lines.join('\n');
}

// ── Parser ─────────────────────────────────────────────────────────────

const enum State {
  INIT,
  HEADER,
  QUESTION_META,
  ANSWERS,
}

export function parseQuizTxt(input: string): ParseResult {
  const rawLines = input.split(/\r?\n/);
  const errors: ParseError[] = [];

  let title = '';
  let description: string | undefined;
  const questions: CreateQuestionInput[] = [];

  let state: State = State.INIT;
  let currentQuestion: Partial<CreateQuestionInput> | null = null;
  let currentAnswers: CreateAnswerInput[] = [];
  let questionIndex = 0;

  function finalizeQuestion(lineNum: number) {
    if (!currentQuestion) return;

    const qType = (currentQuestion.questionType ?? 'multiple-choice') as QuestionType;

    // Post-parse validation
    if (qType === 'number-guess') {
      if (currentQuestion.correctNumber === undefined) {
        errors.push({ line: lineNum, message: `Question "${currentQuestion.text}" (number-guess) requires an answer: value` });
      }
      if (currentQuestion.tolerance === undefined) {
        errors.push({ line: lineNum, message: `Question "${currentQuestion.text}" (number-guess) requires a tolerance: value` });
      }
    } else {
      if (currentAnswers.length < 2) {
        errors.push({ line: lineNum, message: `Question "${currentQuestion.text}" must have at least 2 answers` });
      }

      if (qType === 'multiple-choice' || qType === 'true-false') {
        const correctCount = currentAnswers.filter((a) => a.isCorrect).length;
        if (correctCount !== 1) {
          errors.push({
            line: lineNum,
            message: `Question "${currentQuestion.text}" (${qType}) must have exactly 1 correct answer, found ${correctCount}`,
          });
        }
      }

      if (qType === 'true-false' && currentAnswers.length !== 2) {
        errors.push({
          line: lineNum,
          message: `Question "${currentQuestion.text}" (true-false) must have exactly 2 answers`,
        });
      }

      if (qType === 'multi-select') {
        const correctCount = currentAnswers.filter((a) => a.isCorrect).length;
        if (correctCount < 1) {
          errors.push({
            line: lineNum,
            message: `Question "${currentQuestion.text}" (multi-select) must have at least 1 correct answer`,
          });
        }
      }
    }

    questions.push({
      text: currentQuestion.text!,
      description: currentQuestion.description,
      questionType: qType,
      timeLimit: currentQuestion.timeLimit ?? DEFAULT_TIME_LIMIT,
      points: currentQuestion.points ?? DEFAULT_POINTS,
      requireAll: currentQuestion.requireAll ?? false,
      orderIndex: questionIndex,
      answers: currentAnswers,
      correctNumber: currentQuestion.correctNumber,
      tolerance: currentQuestion.tolerance,
    });

    questionIndex++;
    currentQuestion = null;
    currentAnswers = [];
  }

  for (let i = 0; i < rawLines.length; i++) {
    const lineNum = i + 1;
    const line = rawLines[i];
    const trimmed = line.trim();

    // Skip blank lines
    if (trimmed === '') {
      continue;
    }

    // Title line
    if (trimmed.startsWith('# ') && !trimmed.startsWith('## ')) {
      if (state !== State.INIT) {
        errors.push({ line: lineNum, message: 'Unexpected title line (# ...), title was already set' });
        continue;
      }
      title = trimmed.slice(2).trim();
      if (!title) {
        errors.push({ line: lineNum, message: 'Title cannot be empty' });
      }
      state = State.HEADER;
      continue;
    }

    // Description line
    if (trimmed.startsWith('> ')) {
      if (state !== State.HEADER) {
        errors.push({ line: lineNum, message: 'Description (> ...) must appear right after the title' });
        continue;
      }
      description = trimmed.slice(2).trim();
      continue;
    }

    // Question heading
    if (trimmed.startsWith('## ')) {
      if (state === State.INIT) {
        errors.push({ line: lineNum, message: 'Missing title (# ...) before first question' });
      }
      // Finalize previous question
      if (currentQuestion) {
        finalizeQuestion(lineNum - 1);
      }

      const text = trimmed.slice(3).trim();
      if (!text) {
        errors.push({ line: lineNum, message: 'Question text cannot be empty' });
      }
      currentQuestion = { text };
      currentAnswers = [];
      state = State.QUESTION_META;
      continue;
    }

    // Question description (>> ...)
    if (trimmed.startsWith('>> ')) {
      if (!currentQuestion) {
        errors.push({ line: lineNum, message: 'Question description (>> ...) outside of a question block' });
        continue;
      }
      if (state !== State.QUESTION_META) {
        errors.push({ line: lineNum, message: 'Question description (>> ...) must appear right after the question heading' });
        continue;
      }
      currentQuestion.description = trimmed.slice(3).trim();
      continue;
    }

    // Meta lines (type:, time:, points:, requireAll:)
    if (state === State.QUESTION_META || state === State.ANSWERS) {
      const metaMatch = trimmed.match(/^(type|time|points|requireAll|answer|tolerance)\s*:\s*(.+)$/);
      if (metaMatch && state === State.QUESTION_META) {
        const [, key, value] = metaMatch;
        if (!currentQuestion) {
          errors.push({ line: lineNum, message: 'Metadata outside of a question block' });
          continue;
        }

        switch (key) {
          case 'type': {
            const validTypes: QuestionType[] = ['multiple-choice', 'true-false', 'multi-select', 'ordering', 'number-guess'];
            if (!validTypes.includes(value.trim() as QuestionType)) {
              errors.push({ line: lineNum, message: `Invalid question type: "${value.trim()}"` });
            } else {
              currentQuestion.questionType = value.trim() as QuestionType;
            }
            break;
          }
          case 'time': {
            const n = parseInt(value.trim(), 10);
            if (isNaN(n) || n < 5 || n > 120) {
              errors.push({ line: lineNum, message: `Invalid time limit: "${value.trim()}" (must be 5-120)` });
            } else {
              currentQuestion.timeLimit = n;
            }
            break;
          }
          case 'points': {
            const n = parseInt(value.trim(), 10);
            if (isNaN(n) || n < 0) {
              errors.push({ line: lineNum, message: `Invalid points: "${value.trim()}" (must be >= 0)` });
            } else {
              currentQuestion.points = n;
            }
            break;
          }
          case 'requireAll': {
            const v = value.trim().toLowerCase();
            if (v !== 'true' && v !== 'false') {
              errors.push({ line: lineNum, message: `Invalid requireAll: "${value.trim()}" (must be true or false)` });
            } else {
              currentQuestion.requireAll = v === 'true';
            }
            break;
          }
          case 'answer': {
            const n = parseFloat(value.trim());
            if (isNaN(n)) {
              errors.push({ line: lineNum, message: `Invalid answer number: "${value.trim()}"` });
            } else {
              currentQuestion.correctNumber = n;
            }
            break;
          }
          case 'tolerance': {
            const n = parseFloat(value.trim());
            if (isNaN(n) || n <= 0) {
              errors.push({ line: lineNum, message: `Invalid tolerance: "${value.trim()}" (must be > 0)` });
            } else {
              currentQuestion.tolerance = n;
            }
            break;
          }
        }
        continue;
      }
    }

    // Answer lines
    // Correct: * text
    if (trimmed.startsWith('* ')) {
      if (!currentQuestion) {
        errors.push({ line: lineNum, message: 'Answer outside of a question block' });
        continue;
      }
      state = State.ANSWERS;
      const text = trimmed.slice(2).trim();
      if (!text) {
        errors.push({ line: lineNum, message: 'Answer text cannot be empty' });
        continue;
      }
      currentAnswers.push({
        text,
        isCorrect: true,
        orderIndex: currentAnswers.length,
      });
      continue;
    }

    // Wrong: - text
    if (trimmed.startsWith('- ')) {
      if (!currentQuestion) {
        errors.push({ line: lineNum, message: 'Answer outside of a question block' });
        continue;
      }
      state = State.ANSWERS;
      const text = trimmed.slice(2).trim();
      if (!text) {
        errors.push({ line: lineNum, message: 'Answer text cannot be empty' });
        continue;
      }
      currentAnswers.push({
        text,
        isCorrect: false,
        orderIndex: currentAnswers.length,
      });
      continue;
    }

    // Ordering: 1. text
    const orderMatch = trimmed.match(/^(\d+)\.\s+(.+)$/);
    if (orderMatch) {
      if (!currentQuestion) {
        errors.push({ line: lineNum, message: 'Answer outside of a question block' });
        continue;
      }
      state = State.ANSWERS;
      const text = orderMatch[2].trim();
      if (!text) {
        errors.push({ line: lineNum, message: 'Answer text cannot be empty' });
        continue;
      }
      currentAnswers.push({
        text,
        isCorrect: true, // ordering answers are all "correct" positionally
        orderIndex: currentAnswers.length,
      });
      continue;
    }

    // Unrecognized line
    errors.push({ line: lineNum, message: `Unrecognized line: "${trimmed}"` });
  }

  // Finalize last question
  if (currentQuestion) {
    finalizeQuestion(rawLines.length);
  }

  // Global validation
  if (!title) {
    errors.push({ line: 1, message: 'Missing quiz title (# ...)' });
  }

  if (questions.length === 0 && errors.length === 0) {
    errors.push({ line: 1, message: 'Quiz must have at least one question' });
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    data: {
      title,
      description,
      questions,
    },
  };
}

// ── Helpers ────────────────────────────────────────────────────────────

export function sanitizeFilename(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50) || 'quiz';
}

export function downloadQuizTxt(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
