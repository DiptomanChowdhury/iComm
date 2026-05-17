import React from 'react';
import StatusPill from '../core/StatusPill';

export default React.memo(function StatusBar({ connected, hasFace, calibrated, streamLive, warmup }) {
  const eyeStatus = connected && hasFace
    ? 'active'
    : connected && (warmup || !streamLive)
      ? 'warning'
      : connected
        ? 'error'
        : 'inactive';
  const webcamStatus = connected && streamLive ? 'active' : connected ? 'warning' : 'error';
  const calibStatus = calibrated ? 'active' : 'warning';

  const eyeLabel = eyeStatus === 'active'
    ? 'Eye Tracking: Active'
    : eyeStatus === 'warning'
      ? 'Eye Tracking: Starting...'
      : eyeStatus === 'error'
        ? 'Eye Tracking: Lost'
        : 'Eye Tracking: Inactive';

  const webcamLabel = webcamStatus === 'active'
    ? 'Webcam: Connected'
    : webcamStatus === 'warning'
      ? 'Webcam: Connecting...'
      : 'Webcam: Disconnected';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
      <StatusPill label={eyeLabel} status={eyeStatus} />
      <StatusPill label={webcamLabel} status={webcamStatus} />
      <StatusPill
        label={calibStatus === 'active' ? 'Calibrated' : 'Needs Calibration'}
        status={calibStatus}
      />
    </div>
  );
});
