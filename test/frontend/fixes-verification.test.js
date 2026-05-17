import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, relative, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..', '..');
const SRC = join(ROOT, 'src');

function readSrc(relPath) {
  return readFileSync(join(SRC, relPath), 'utf-8');
}

function readRoot(relPath) {
  return readFileSync(join(ROOT, relPath), 'utf-8');
}

// ---------------------------------------------------------------------------
// FIX 1 — Folder Structure
// ---------------------------------------------------------------------------
describe('FIX 1 — Folder Structure', () => {
  const componentDirs = [
    'core', 'layout', 'keyboard', 'phrases', 'emergency',
    'calibration', 'feedback', 'settings', 'message',
  ];

  test('all component directories are flat under src/components/', () => {
    for (const dir of componentDirs) {
      const p = join(SRC, 'components', dir);
      expect(existsSync(p)).toBe(true);
      expect(existsSync(join(p, 'components'))).toBe(false);
    }
  });

  test('context dir is flat under src/context/', () => {
    const p = join(SRC, 'context');
    expect(existsSync(p)).toBe(true);
    expect(existsSync(join(p, 'context'))).toBe(false);
  });

  test('hooks dir is flat under src/hooks/', () => {
    const p = join(SRC, 'hooks');
    expect(existsSync(p)).toBe(true);
    expect(existsSync(join(p, 'hooks'))).toBe(false);
  });

  test('App.jsx imports use correct flat paths', () => {
    const app = readSrc('App.jsx');
    expect(app).toContain(`from './context/GazeContext'`);
    expect(app).toContain(`from './context/SettingsContext'`);
    expect(app).toContain(`from './components/layout/AppShell'`);
    expect(app).toContain(`from './components/calibration/CalibrationScreen'`);
    expect(app).toContain(`from './components/settings/SettingsPanel'`);
  });

  test('Sidebar.jsx imports use correct flat paths', () => {
    const sidebar = readSrc('components/layout/Sidebar.jsx');
    expect(sidebar).toContain(`from '../core/DwellButton'`);
    expect(sidebar).toContain(`from '../../context/SettingsContext'`);
    expect(sidebar).toContain(`from '../../hooks/useTTS'`);
  });

  test('no import contains "components/components/" pattern', () => {
    const allJsx = [];
    function walk(dir) {
      for (const entry of readdirSync(dir)) {
        const full = join(dir, entry);
        if (statSync(full).isDirectory()) walk(full);
        else if (entry.endsWith('.jsx')) allJsx.push(readFileSync(full, 'utf-8'));
      }
    }
    walk(join(SRC, 'components'));
    walk(join(SRC, 'context'));
    walk(join(SRC, 'hooks'));
    allJsx.push(readSrc('App.jsx'));
    for (const content of allJsx) {
      expect(content).not.toMatch(/components\/components\//);
    }
  });
});

// ---------------------------------------------------------------------------
// FIX 2 — BACKSPACE Key Appends Literal String
// ---------------------------------------------------------------------------
describe('FIX 2 — BACKSPACE Handler', () => {
  test('AppShell.jsx handles BACKSPACE and newline specially', () => {
    const shell = readSrc('components/layout/AppShell.jsx');
    expect(shell).toMatch(/char === 'BACKSPACE'/);
    expect(shell).toMatch(/char === '\\n'/);
    expect(shell).toContain(`backspaceMessage()`);
    expect(shell).toContain(`appendToMessage('\\n')`);
    expect(shell).toContain(`onOpenPhrases`);
  });

  test('VirtualKeyboard sends BACKSPACE and \\n as keyId strings', () => {
    const kb = readSrc('components/keyboard/VirtualKeyboard.jsx');
    expect(kb).toContain(`onKeyPress('BACKSPACE')`);
    expect(kb).toContain(`onKeyPress('\\n')`);
  });
});

// ---------------------------------------------------------------------------
// FIX 3 — Calibration Buttons Gaze-Operable
// ---------------------------------------------------------------------------
describe('FIX 3 — Calibration Buttons Use DwellButton', () => {
  test('CalibrationScreen.jsx imports DwellButton', () => {
    const screen = readSrc('components/calibration/CalibrationScreen.jsx');
    expect(screen).toContain(`import DwellButton from '../core/DwellButton'`);
  });

  test('"Start Calibration" uses DwellButton', () => {
    const screen = readSrc('components/calibration/CalibrationScreen.jsx');
    expect(screen).toContain(`label="Start Calibration"`);
    expect(screen).toContain(`variant="action"`);
    expect(screen).toContain(`ariaLabel="Start eye tracking calibration"`);
    expect(screen).toContain('onSelect={startCalibration}');
  });

  test('"Continue" button (complete phase) uses DwellButton', () => {
    const screen = readSrc('components/calibration/CalibrationScreen.jsx');
    expect(screen).toContain(`label="Continue"`);
    expect(screen).toContain(`ariaLabel="Close calibration`);
    expect(screen).toContain(`onSelect={onClose}`);
  });

  test('No plain <button> remains for Start Calibration or Close', () => {
    const screen = readSrc('components/calibration/CalibrationScreen.jsx');
    const buttonCount = (screen.match(/<button[\s>/]/g) || []).length;
    expect(buttonCount).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// FIX 4 — Hardcoded PIN Configurable
// ---------------------------------------------------------------------------
describe('FIX 4 — Configurable PIN', () => {
  test('useSettings.js has settingsPin in defaults', () => {
    const hook = readSrc('hooks/useSettings.js');
    expect(hook).toContain(`settingsPin: '0000'`);
  });

  test('SettingsPanel.jsx checks against settings.settingsPin', () => {
    const panel = readSrc('components/settings/SettingsPanel.jsx');
    expect(panel).toContain(`pin === settings.settingsPin`);
  });

  test('SettingsPanel.jsx has Change PIN section with 3 inputs and Save button', () => {
    const panel = readSrc('components/settings/SettingsPanel.jsx');
    expect(panel).toContain(`Change PIN`);
    expect(panel).toContain(`placeholder="Current PIN"`);
    expect(panel).toContain(`placeholder="New PIN"`);
    expect(panel).toContain(`placeholder="Confirm new PIN"`);
    expect(panel).toContain(`Save PIN`);
  });

  test('Change PIN logic validates current, match, and length', () => {
    const panel = readSrc('components/settings/SettingsPanel.jsx');
    expect(panel).toContain(`changePin.current !== settings.settingsPin`);
    expect(panel).toContain(`changePin.newPin !== changePin.confirm`);
    expect(panel).toContain(`changePin.newPin.length !== 4`);
    expect(panel).toContain(`updateSetting('settingsPin', changePin.newPin)`);
  });
});

// ---------------------------------------------------------------------------
// FIX 5 — POSITIONS_PX in Component
// ---------------------------------------------------------------------------
describe('FIX 5 — positionsPx Computed Inside Component', () => {
  test('POSITIONS_PX module-level constant is removed', () => {
    const screen = readSrc('components/calibration/CalibrationScreen.jsx');
    expect(screen).not.toContain('const POSITIONS_PX');
  });

  test('positionsPx is useState inside component', () => {
    const screen = readSrc('components/calibration/CalibrationScreen.jsx');
    expect(screen).toContain(`const [positionsPx, setPositionsPx] = useState([])`);
  });

  test('useEffect computes positionsPx with window dimensions and resize listener', () => {
    const screen = readSrc('components/calibration/CalibrationScreen.jsx');
    expect(screen).toContain(`window.innerWidth`);
    expect(screen).toContain(`window.innerHeight`);
    expect(screen).toContain(`window.addEventListener('resize', compute)`);
    expect(screen).toContain(`window.removeEventListener('resize', compute)`);
  });

  test('Rendering guards against empty positionsPx', () => {
    const screen = readSrc('components/calibration/CalibrationScreen.jsx');
    expect(screen).toContain(`positionsPx.length > 0`);
    expect(screen).toContain(`positionsPx.slice(0, currentDot + 1)`);
  });
});

// ---------------------------------------------------------------------------
// FIX 6 — Inter Font in index.html
// ---------------------------------------------------------------------------
describe('FIX 6 — Inter Font', () => {
  const html = readSrc('index.html');

  test('has preconnect links for Google Fonts', () => {
    expect(html).toContain('fonts.googleapis.com');
    expect(html).toContain('fonts.gstatic.com');
  });

  test('loads Inter font stylesheet', () => {
    expect(html).toContain('Inter');
    expect(html).toContain('display=swap');
  });

  test('has correct title', () => {
    expect(html).toContain('<title>iComm — Eye-Controlled AAC</title>');
  });
});

// ---------------------------------------------------------------------------
// FIX 7 — Settings Persistence
// ---------------------------------------------------------------------------
describe('FIX 7 — Settings Persistence', () => {
  test('preload.js exposes electronAPI.loadSettings and .saveSettings', () => {
    const preload = readSrc('preload.js');
    expect(preload).toContain(`loadSettings`);
    expect(preload).toContain(`saveSettings`);
    expect(preload).toContain(`ipcRenderer.invoke('settings:load'`);
    expect(preload).toContain(`ipcRenderer.invoke('settings:save'`);
    expect(preload).toContain(`contextBridge.exposeInMainWorld`);
  });

  test('main.js has IPC handlers for settings with userData path', () => {
    const main = readSrc('main.js');
    expect(main).toContain(`icomm-settings.json`);
    expect(main).toContain(`settings:load`);
    expect(main).toContain(`settings:save`);
    expect(main).toContain(`app.getPath('userData')`);
  });

  test('useSettings.js loads from electronAPI on mount', () => {
    const hook = readSrc('hooks/useSettings.js');
    expect(hook).toContain(`window.electronAPI.loadSettings()`);
    expect(hook).toContain(`window.electronAPI.saveSettings`);
  });

  test('useSettings.js guards with if (window.electronAPI)', () => {
    const hook = readSrc('hooks/useSettings.js');
    const matches = hook.match(/if \(window\.electronAPI\)/g);
    expect(matches).toBeTruthy();
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });
});

// ---------------------------------------------------------------------------
// FIX 8 — Emergency Backend Calls
// ---------------------------------------------------------------------------
describe('FIX 8 — Emergency Backend Calls', () => {
  test('Sidebar.jsx has fetch calls in handleEmergencyAction', () => {
    const sidebar = readSrc('components/layout/Sidebar.jsx');
    expect(sidebar).toContain(`from '../../utils/postAlert'`);
    expect(sidebar).toContain(`postAlert(action`);
    expect(sidebar).toContain(`startCooldown(action)`);
    expect(sidebar).toContain(`setEmergencyModal(null)`);
  });

  test('config/api.js defines local defaults and endpoint paths', () => {
    const api = readSrc('config/api.js');
    expect(api).toContain(`http://localhost:8000`);
    expect(api).toContain(`ws://localhost:8765`);
    expect(api).toContain(`/send-alert`);
    expect(api).toContain(`/send-caregiver-alert`);
    expect(api).toContain(`/send-quick-message`);
  });

  test('handleEmergencyAction correct dependency array', () => {
    const sidebar = readSrc('components/layout/Sidebar.jsx');
    expect(sidebar).toContain(`[startCooldown, settings, messageText]`);
  });
});

// ---------------------------------------------------------------------------
// FIX 9 — useGaze Reconnect Loop
// ---------------------------------------------------------------------------
describe('FIX 9 — useGaze Reconnect Loop Fix', () => {
  test('onBlinkRef pattern stores onBlink callback ref', () => {
    const gaze = readSrc('hooks/useGaze.js');
    expect(gaze).toContain(`onBlinkRef`);
    expect(gaze).toContain(`useRef(onBlink)`);
    expect(gaze).toContain(`onBlinkRef.current = onBlink`);
  });

  test('connect useCallback has empty deps array', () => {
    const gaze = readSrc('hooks/useGaze.js');
    expect(gaze).toContain(`const connect = useCallback(() => {`);
    expect(gaze).toContain(`}, []);`);
    expect(gaze).toContain(`onBlinkRef.current`);
  });
});

// ---------------------------------------------------------------------------
// FIX 10 — Gaze Smoothing
// ---------------------------------------------------------------------------
describe('FIX 10 — Gaze Smoothing', () => {
  test('smoothedRef applies exponential smoothing to coordinates', () => {
    const gaze = readSrc('hooks/useGaze.js');
    expect(gaze).toContain(`const smoothedRef = useRef`);
    expect(gaze).toContain(`export function screenToViewport`);
    expect(gaze).toContain(`alpha * x`);
    expect(gaze).toContain(`alpha * y`);
    expect(gaze).toContain(`(1 - alpha) *`);
  });

  test('useGaze accepts gazeAlpha parameter', () => {
    const gaze = readSrc('hooks/useGaze.js');
    expect(gaze).toContain(`export default function useGaze(onBlink, gazeAlpha)`);
  });

  test('GazeContext.jsx reads settings.gazeAlpha and passes to useGaze', () => {
    const ctx = readSrc('context/GazeContext.jsx');
    expect(ctx).toContain(`useSettingsContext`);
    expect(ctx).toContain(`settings.gazeAlpha`);
    expect(ctx).toContain(`useGaze(handleBlink, settings.gazeAlpha)`);
  });
});

// ---------------------------------------------------------------------------
// FIX 11 — hasFace Debounce
// ---------------------------------------------------------------------------
describe('FIX 11 — hasFace Debounce', () => {
  test('faceTimeoutRef is declared and used for debouncing', () => {
    const gaze = readSrc('hooks/useGaze.js');
    expect(gaze).toContain(`faceTimeoutRef`);
    expect(gaze).toContain(`setTimeout`);
    expect(gaze).toContain(`FACE_LOST_DEBOUNCE_MS`);
  });

  test('hasFace true is set immediately, false is debounced', () => {
    const gaze = readSrc('hooks/useGaze.js');
    expect(gaze).toContain(`if (data.hasface === true)`);
    expect(gaze).toContain(`setHasFace(true)`);
    expect(gaze).toContain(`clearTimeout(faceTimeoutRef.current)`);
    expect(gaze).toContain(`data.hasface === false && !faceTimeoutRef.current`);
  });
});

// ---------------------------------------------------------------------------
// FIX 12 — EmergencyPanel Implementation
// ---------------------------------------------------------------------------
describe('FIX 12 — EmergencyPanel Implemented', () => {
  test('EmergencyPanel.jsx renders 3 DwellButtons', () => {
    const panel = readSrc('components/emergency/EmergencyPanel.jsx');
    expect(panel).toContain(`Emergency Call`);
    expect(panel).toContain(`Caregiver Alert`);
    expect(panel).toContain(`Quick Message`);
    const dwellButtons = panel.match(/<DwellButton/g);
    expect(dwellButtons).toHaveLength(3);
  });

  test('EmergencyPanel accepts onAction and cooldown props and dispatches action types', () => {
    const panel = readSrc('components/emergency/EmergencyPanel.jsx');
    expect(panel).toContain(`{ onAction, cooldown }`);
    expect(panel).toContain(`() => onAction('emergency')`);
    expect(panel).toContain(`() => onAction('caregiver')`);
    expect(panel).toContain(`() => onAction('quickmsg')`);
  });

  test('Sidebar.jsx imports and uses EmergencyPanel', () => {
    const sidebar = readSrc('components/layout/Sidebar.jsx');
    expect(sidebar).toContain(`import EmergencyPanel from '../emergency/EmergencyPanel'`);
    expect(sidebar).toContain(`<EmergencyPanel`);
  });
});

// ---------------------------------------------------------------------------
// FIX 13 — TTS Hook Unification
// ---------------------------------------------------------------------------
describe('FIX 13 — useTTS Hook in Sidebar', () => {
  test('Sidebar imports useTTS', () => {
    const sidebar = readSrc('components/layout/Sidebar.jsx');
    expect(sidebar).toContain(`import useTTS from '../../hooks/useTTS'`);
  });

  test('Sidebar destructures speak from useTTS()', () => {
    const sidebar = readSrc('components/layout/Sidebar.jsx');
    expect(sidebar).toContain(`const { speak } = useTTS()`);
  });

  test('Speak button calls speak(messageText)', () => {
    const sidebar = readSrc('components/layout/Sidebar.jsx');
    expect(sidebar).toContain(`speak(messageText)`);
    expect(sidebar).not.toContain(`SpeechSynthesisUtterance`);
  });
});

// ---------------------------------------------------------------------------
// ROUND 3 — 4 targeted fixes
// ---------------------------------------------------------------------------
describe('Round 3 — FIX 1: gazeAlpha ref in WebSocket closure', () => {
  test('gazeAlphaRef is declared and synced via useEffect', () => {
    const gaze = readSrc('hooks/useGaze.js');
    expect(gaze).toContain('const gazeAlphaRef = useRef(gazeAlpha ?? 1)');
    expect(gaze).toContain('gazeAlphaRef.current = gazeAlpha ?? 1');
  });

  test('ws.onmessage reads gazeAlphaRef.current instead of captured gazeAlpha', () => {
    const gaze = readSrc('hooks/useGaze.js');
    expect(gaze).toContain('const alpha = gazeAlphaRef.current;');
    expect(gaze).not.toContain("typeof gazeAlpha === 'number'");
  });
});

describe('Round 3 — FIX 2: EmergencyPanel cooldown prop', () => {
  test('EmergencyPanel accepts cooldown prop', () => {
    const panel = readSrc('components/emergency/EmergencyPanel.jsx');
    expect(panel).toContain('{ onAction, cooldown }');
  });

  test('Each DwellButton receives disabled from cooldown', () => {
    const panel = readSrc('components/emergency/EmergencyPanel.jsx');
    expect(panel).toContain('disabled={cooldown?.emergency ?? false}');
    expect(panel).toContain('disabled={cooldown?.caregiver ?? false}');
    expect(panel).toContain('disabled={cooldown?.quickmsg ?? false}');
  });

  test('Sidebar passes cooldown prop to EmergencyPanel', () => {
    const sidebar = readSrc('components/layout/Sidebar.jsx');
    expect(sidebar).toContain('cooldown={emergencyCooldown}');
  });
});

describe('Round 3 — FIX 3: DevTools gate for production', () => {
  test('main.js guards openDevTools with !app.isPackaged', () => {
    const main = readSrc('main.js');
    expect(main).toContain("if (!app.isPackaged) mainWindow.webContents.openDevTools()");
  });
});

describe('Round 3 — FIX 4: Emergency confirm modal audible alert', () => {
  test('EmergencyConfirmModal has useEffect with SpeechSynthesisUtterance', () => {
    const modal = readSrc('components/emergency/EmergencyConfirmModal.jsx');
    expect(modal).toContain('SpeechSynthesisUtterance(msg)');
    expect(modal).toContain("window.speechSynthesis.cancel()");
    expect(modal).toContain('u.rate = 1.1');
    expect(modal).toContain("Emergency call will be triggered");
    expect(modal).toContain("Caregiver alert will be sent");
    expect(modal).toContain("Quick message will be sent");
  });
});
