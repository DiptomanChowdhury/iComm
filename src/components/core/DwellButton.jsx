import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useGazeContext } from '../../context/GazeContext';
import ProgressRing from './ProgressRing';

const COOLDOWN_MS = 800;
const FLASH_MS = 200;

const SIZE_STYLES = {
  sm: { padding: '6px 12px', fontSize: 'var(--text-sm)', minHeight: 36, minWidth: 48 },
  md: { padding: '10px 18px', fontSize: 'var(--text-base)', minHeight: 48, minWidth: 64 },
  lg: { padding: '14px 24px', fontSize: 'var(--text-lg)', minHeight: 56, minWidth: 80 },
};

const VARIANT_STYLES = {
  key: { background: 'var(--bg-key)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' },
  phrase: { background: 'var(--bg-surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' },
  action: { background: 'var(--accent-blue)', border: 'none', color: '#FFFFFF', fontWeight: 600 },
  emergency: { background: 'var(--bg-surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' },
};

export default React.memo(function DwellButton({
  label,
  onSelect,
  dwellTime: propDwellTime,
  size = 'md',
  variant = 'key',
  ariaLabel,
  disabled = false,
  style,
  className,
}) {
  const { gazePos, hasFace, connected, warmup } = useGazeContext();
  const [progress, setProgress] = useState(0);
  const [isGazing, setIsGazing] = useState(false);
  const [cooldown, setCooldown] = useState(false);
  const [flash, setFlash] = useState(false);
  const [layoutTick, setLayoutTick] = useState(0);
  const buttonRef = useRef(null);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const dwellTime = propDwellTime || 1500;
  const isGazingRef = useRef(false);
  const cooldownRef = useRef(false);
  const onSelectRef = useRef(onSelect);

  useEffect(() => { onSelectRef.current = onSelect; }, [onSelect]);

  const isReducedMotion = useCallback(() => {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  useEffect(() => {
    const bump = () => setLayoutTick((t) => t + 1);
    window.addEventListener('resize', bump);
    window.addEventListener('scroll', bump, true);
    return () => {
      window.removeEventListener('resize', bump);
      window.removeEventListener('scroll', bump, true);
    };
  }, []);

  useEffect(() => {
    const onLongBlink = () => {
      if (!isGazingRef.current || cooldownRef.current || disabled) return;
      clearInterval(timerRef.current);
      timerRef.current = null;
      setProgress(0);
      setIsGazing(false);
      isGazingRef.current = false;
      setCooldown(true);
      cooldownRef.current = true;
      setTimeout(() => {
        setCooldown(false);
        cooldownRef.current = false;
      }, COOLDOWN_MS);
      setFlash(true);
      setTimeout(() => setFlash(false), FLASH_MS);
      onSelectRef.current();
    };

    const onShortBlink = () => {
      if (!isGazingRef.current || cooldownRef.current) return;
      clearInterval(timerRef.current);
      timerRef.current = null;
      setProgress(0);
      setIsGazing(false);
      isGazingRef.current = false;
    };

    window.addEventListener('long-blink', onLongBlink);
    window.addEventListener('short-blink', onShortBlink);
    return () => {
      window.removeEventListener('long-blink', onLongBlink);
      window.removeEventListener('short-blink', onShortBlink);
    };
  }, [disabled]);

  useEffect(() => {
    if (!buttonRef.current || cooldown || disabled) return;

    if (!connected || warmup || !hasFace) {
      if (isGazing) {
        clearInterval(timerRef.current);
        timerRef.current = null;
        setProgress(0);
        setIsGazing(false);
        isGazingRef.current = false;
      }
      return;
    }

    const rect = buttonRef.current.getBoundingClientRect();
    const isInside =
      gazePos.x >= rect.left &&
      gazePos.x <= rect.right &&
      gazePos.y >= rect.top &&
      gazePos.y <= rect.bottom;

    if (isInside && !isGazing) {
      setIsGazing(true);
      isGazingRef.current = true;
      startTimeRef.current = Date.now();

      timerRef.current = setInterval(() => {
        const elapsed = Date.now() - startTimeRef.current;
        const pct = Math.min((elapsed / dwellTime) * 100, 100);
        setProgress(pct);
      }, 16);
    } else if (!isInside && isGazing) {
      clearInterval(timerRef.current);
      timerRef.current = null;
      setProgress(0);
      setIsGazing(false);
      isGazingRef.current = false;
    }
  }, [gazePos, cooldown, disabled, dwellTime, isReducedMotion, connected, hasFace, isGazing, layoutTick, warmup]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const sizeStyle = SIZE_STYLES[size] || SIZE_STYLES.md;
  const variantStyle = VARIANT_STYLES[variant] || VARIANT_STYLES.key;

  const flashOverlay = flash ? (
    <div style={{
      position: 'absolute', inset: 0, borderRadius: 'var(--radius-md)',
      background: 'rgba(0, 230, 118, 0.3)', pointerEvents: 'none',
    }} />
  ) : null;

  return (
    <button
      type="button"
      ref={buttonRef}
      onClick={onSelect}
      disabled={disabled || cooldown}
      aria-label={ariaLabel || label}
      aria-pressed={isGazing}
      data-dwell-active={isGazing}
      style={{
        position: 'relative',
        ...sizeStyle,
        ...variantStyle,
        borderRadius: 'var(--radius-md)',
        fontWeight: variant === 'action' ? 600 : 500,
        textAlign: 'center',
        cursor: 'default',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: isReducedMotion() ? 'none' : 'transform 0.15s ease, box-shadow 0.2s ease, background 0.2s ease',
        transform: isGazing ? 'scale(1.05)' : 'scale(1)',
        boxShadow: isGazing ? (variant === 'action' || variant === 'emergency' ? 'var(--shadow-glow-green)' : 'var(--shadow-glow-blue)') : 'none',
        opacity: cooldown ? 0.5 : (disabled ? 0.35 : 1),
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis',
        border: isGazing ? '1px solid var(--border-focus)' : variantStyle.border,
        outline: 'none',
        fontFamily: 'var(--font-ui)',
        ...style,
      }}
      className={className}
    >
      {label}
      {flashOverlay}
      {isGazing && !isReducedMotion() && <ProgressRing progress={progress} />}
    </button>
  );
});
