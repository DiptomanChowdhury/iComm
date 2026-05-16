# Round 3 — 4 Targeted Fixes

**Date:** 2026-05-16
**Branch:** feat/frontend-ui-overhaul
**Status:** Approved

## Overview

Four independent production-grade fixes addressing stale closure state, missing cooldown
propagation, debug leak in packaged builds, and missing audible feedback on emergency modals.

---

## FIX 1 — gazeAlpha Stale in WebSocket Closure

**Problem:** `gazeAlpha` is captured by the `ws.onmessage` closure inside `connect()`,
but `connect` has empty dependency array `[]`. When the user adjusts the smoothing slider
in settings, `gazeAlpha` changes but the message handler still uses the initial value.

**Solution:** Mirror the existing `onBlinkRef` pattern — introduce `gazeAlphaRef` that stays
in sync via its own `useEffect`. The message handler reads `gazeAlphaRef.current` instead of
the captured `gazeAlpha`.

**Files changed:**
- `src/hooks/useGaze.js` — add `gazeAlphaRef`, sync effect, update alpha read

---

## FIX 2 — EmergencyPanel Cooldown Not Applied

**Problem:** Sidebar owns `emergencyCooldown` state and applies `disabled` to its inlined
buttons. But the extraction into `EmergencyPanel` (Round 2, FIX 12) forgot to pass this
prop, so cooldown has no visual effect — buttons remain immediately re-triggerable.

**Solution:** Add a `cooldown` prop to `EmergencyPanel` of shape
`{ emergency: bool, caregiver: bool, quickmsg: bool }`. Each `DwellButton` receives
`disabled={cooldown?.[type] ?? false}`. Sidebar passes `emergencyCooldown` as `cooldown`.

**Files changed:**
- `src/components/emergency/EmergencyPanel.jsx` — accept `cooldown` prop, wire to buttons
- `src/components/layout/Sidebar.jsx` — pass `cooldown={emergencyCooldown}`

---

## FIX 3 — DevTools Open in Production

**Problem:** `mainWindow.webContents.openDevTools()` is called unconditionally. Packaged
builds will leak the debug panel to end users.

**Solution:** Guard with `if (!app.isPackaged)` so DevTools only open during development.

**Files changed:**
- `src/main.js` — add guard before `openDevTools()`

---

## FIX 4 — Emergency Confirm Modal Audible Alert

**Problem:** When the confirm modal appears, a motor-impaired user may not notice it.
There is no audible feedback to announce the action being confirmed.

**Solution:** A `useEffect` speaks the alert type via `SpeechSynthesis` when the modal
mounts and cancels speech on unmount. This reuses the browser's built-in TTS — no
dependency on the `useTTS` hook (which requires settings context and would add coupling).

**Files changed:**
- `src/components/emergency/EmergencyConfirmModal.jsx` — add `useEffect` with speech

---

## Error Handling

- **FIX 1:** `gazeAlphaRef.current` always falls back to `0.3` if `gazeAlpha` is null/undefined
- **FIX 2:** `disabled` is only applied when cooldown object exists — safe default is `false`
- **FIX 3:** Simple conditional — no failure mode
- **FIX 4:** Speech synthesis errors are silently ignored (browser handles unsupported voices)

## Testing

- FIX 1: Verify `gazeAlphaRef` exists and is read inside `ws.onmessage`
- FIX 2: Verify `cooldown` prop passed to `EmergencyPanel`, `disabled` on each `DwellButton`
- FIX 3: Verify `if (!app.isPackaged)` guard before `openDevTools()`
- FIX 4: Verify `useEffect` with `SpeechSynthesisUtterance` in `EmergencyConfirmModal`
