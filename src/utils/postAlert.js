import { ALERT_ENDPOINTS } from '../config/api';

/**
 * POST to the alert API (CORS-enabled). Logs failures in dev; does not throw.
 */
export async function postAlert(action, body = {}) {
  const url = ALERT_ENDPOINTS[action];
  if (!url) return;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      console.warn(`[iComm] ${action} failed:`, response.status, await response.text());
    }
  } catch (err) {
    console.warn(`[iComm] ${action} error:`, err.message);
  }
}
