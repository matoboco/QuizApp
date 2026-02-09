const basePath = import.meta.env.BASE_URL.replace(/\/+$/, '');
export const API_BASE_URL = `${basePath}/api`;
export const SOCKET_URL = '';
export const SOCKET_PATH = basePath ? `${basePath}/socket.io/` : '/socket.io/';
export const APP_NAME = 'QuizApp';
export const AUTH_TOKEN_KEY = 'quiz_auth_token';

export const ANSWER_COLORS = [
  '#e21b3c', // red
  '#1368ce', // blue
  '#d89e00', // gold
  '#26890c', // green
  '#9b2fae', // purple
  '#d35400', // orange
  '#0097a7', // teal
  '#c2185b', // pink
] as const;
export const ANSWER_SHAPES = ['triangle', 'diamond', 'circle', 'square', 'hexagon', 'star', 'pentagon', 'heart'] as const;
export type AnswerShape = (typeof ANSWER_SHAPES)[number];
