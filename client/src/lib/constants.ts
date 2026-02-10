const basePath = import.meta.env.BASE_URL.replace(/\/+$/, '');
export const API_BASE_URL = `${basePath}/api`;
export const SOCKET_URL = '';
export const SOCKET_PATH = basePath ? `${basePath}/socket.io/` : '/socket.io/';
export const APP_NAME = 'QuizBonk';
export const APP_TAGLINE = 'Think fast. Get bonked.';
export const AUTH_TOKEN_KEY = 'quiz_auth_token';

export const ANSWER_COLORS = [
  '#ff1744', // red
  '#2979ff', // blue
  '#ffea00', // yellow
  '#00e676', // green
  '#d500f9', // purple
  '#ff6d00', // orange
  '#00e5ff', // teal
  '#ff4081', // pink
] as const;
export const ANSWER_SHAPES = ['triangle', 'diamond', 'circle', 'square', 'hexagon', 'star', 'pentagon', 'heart'] as const;
export type AnswerShape = (typeof ANSWER_SHAPES)[number];
