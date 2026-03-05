/** Nombre de la cookie de sesión (login). */
export const SESSION_COOKIE = 'pb_session';

/** Duración de la sesión en segundos (8 horas). */
export const SESSION_MAX_AGE = 60 * 60 * 8;

/** Rutas de API. */
export const API = {
  login: '/api/login',
  embedConfig: '/api/embed-config',
} as const;
