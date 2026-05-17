// frontend/src/components/GazeCursor.jsx
import React from 'react';

export default function GazeCursor({ x, y, hasFace }) {
  return (
    <div
      style={{
        position: 'fixed',
        left:     x - 15,          // Center the cursor on gaze point
        top:      y - 15,
        width:    30,
        height:   30,
        borderRadius: '50%',
        backgroundColor: hasFace ? 'rgba(0, 200, 100, 0.7)' : 'rgba(255, 80, 80, 0.7)',
        // Green = face detected,  Red = no face detected
        border: '3px solid white',
        pointerEvents: 'none',     // Cursor does not block mouse clicks
        zIndex: 9999,              // Always on top
        transition: 'left 0.05s, top 0.05s',  // Smooth movement
        boxShadow: '0 0 10px rgba(0,200,100,0.5)',
      }}
    />
  );
}
