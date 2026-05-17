/**
 * Backend connection settings for the renderer.
 *
 * Resolution order (first match wins):
 * 1. window.icommConfig — Electron preload
 * 2. import.meta.env.ICOMM_* — Vite dev / build
 * 3. process.env.ICOMM_* — Node / tests
 * 4. Defaults (localhost)
 */

const DEFAULT_API_BASE = 'http://localhost:8000';
const DEFAULT_GAZE_WS = 'ws://localhost:8765';
const DEFAULT_SCREEN_W = 1920;
const DEFAULT_SCREEN_H = 1080;

function fromVite(key) {
  if (typeof import.meta !== 'undefined' && import.meta.env?.[key]) {
    return import.meta.env[key];
  }
  return undefined;
}

function fromProcess(envKey, fallback) {
  if (typeof process !== 'undefined' && process.env?.[envKey]) {
    return process.env[envKey];
  }
  return fallback;
}

function fromPreload(key, fallback) {
  if (typeof window !== 'undefined' && window.icommConfig?.[key]) {
    return window.icommConfig[key];
  }
  return fallback;
}

function resolve(envKey, preloadKey, fallback) {
  return fromPreload(
    preloadKey,
    fromVite(envKey) ?? fromProcess(envKey, fallback),
  );
}

export const API_BASE_URL = resolve('ICOMM_API_URL', 'apiBaseUrl', DEFAULT_API_BASE);

export const GAZE_WS_URL = resolve('ICOMM_GAZE_WS_URL', 'gazeWsUrl', DEFAULT_GAZE_WS);

/** Must match SCREEN_W / SCREEN_H in Backend/calibration.py (until WS sends screenw/h) */
export const GAZE_SCREEN_W = Number(
  resolve('ICOMM_SCREEN_W', 'gazeScreenW', DEFAULT_SCREEN_W),
);
export const GAZE_SCREEN_H = Number(
  resolve('ICOMM_SCREEN_H', 'gazeScreenH', DEFAULT_SCREEN_H),
);

export function apiUrl(path) {
  const base = API_BASE_URL.replace(/\/$/, '');
  const suffix = path.startsWith('/') ? path : `/${path}`;
  return `${base}${suffix}`;
}

export function gazeStatusUrl() {
  return apiUrl('/gaze/status');
}

export const ALERT_ENDPOINTS = {
  emergency: apiUrl('/send-alert'),
  caregiver: apiUrl('/send-caregiver-alert'),
  quickmsg: apiUrl('/send-quick-message'),
  calibrateDone: apiUrl('/calibrate-done'),
};
