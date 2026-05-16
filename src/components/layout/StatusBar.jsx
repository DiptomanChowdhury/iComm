import React from 'react';
import StatusPill from '../core/StatusPill';

export default React.memo(function StatusBar({ connected, hasFace, calibrated }) {
  const eyeStatus = connected && hasFace ? 'active' : connected ? 'error' : 'inactive';
  const webcamStatus = connected ? 'active' : 'error';
  const calibStatus = calibrated ? 'active' : 'warning';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
      <StatusPill
        label={eyeStatus === 'active' ? 'Eye Tracking: Active' : eyeStatus === 'error' ? 'Eye Tracking: Lost' : 'Eye Tracking: Inactive'}
        status={eyeStatus}
      />
      <StatusPill
        label={webcamStatus === 'active' ? 'Webcam: Connected' : 'Webcam: Disconnected'}
        status={webcamStatus}
      />
      <StatusPill
        label={calibStatus === 'active' ? 'Calibrated' : 'Needs Calibration'}
        status={calibStatus}
      />
    </div>
  );
});
