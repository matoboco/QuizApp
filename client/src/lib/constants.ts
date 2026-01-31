export const API_BASE_URL = '/api';
export const SOCKET_URL = '';
export const APP_NAME = 'QuizApp';
export const AUTH_TOKEN_KEY = 'quiz_auth_token';

export const ANSWER_COLORS = ['#e21b3c', '#1368ce', '#d89e00', '#26890c', '#9b59b6', '#e67e22', '#1abc9c', '#e74c3c'] as const;
export const ANSWER_SHAPES = ['triangle', 'diamond', 'circle', 'square'] as const;
export type AnswerShape = (typeof ANSWER_SHAPES)[number];
