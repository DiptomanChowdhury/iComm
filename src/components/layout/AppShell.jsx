import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import MessageWindow from '../message/MessageWindow';
import VirtualKeyboard from '../keyboard/VirtualKeyboard';
import QuickPhrases from '../phrases/QuickPhrases';
import GazeCursor from '../core/GazeCursor';
import NoFaceWarning from '../feedback/NoFaceWarning';
import ConnectionStatus from '../feedback/ConnectionStatus';

export default React.memo(function AppShell({
  view,
  setView,
  messageText,
  appendToMessage,
  clearMessage,
  backspaceMessage,
  onOpenSettings,
}) {
  return (
    <>
      <GazeCursor />
      <NoFaceWarning />
      <ConnectionStatus />
      <div
        style={{
          display: 'grid',
          gridTemplateRows: 'var(--header-height) 1fr',
          gridTemplateColumns: '1fr var(--sidebar-width)',
          height: '100vh',
          overflow: 'hidden',
        }}
      >
        <div style={{ gridRow: 1, gridColumn: '1 / -1' }}>
          <Header onOpenSettings={onOpenSettings} />
        </div>
        <div
          style={{
            gridRow: 2,
            gridColumn: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            padding: 'var(--sp-3)',
            gap: 'var(--sp-3)',
          }}
        >
          <MessageWindow text={messageText} />
          {view === 'keyboard' && (
            <VirtualKeyboard
              onKeyPress={(char) => {
                if (char === 'BACKSPACE') backspaceMessage();
                else if (char === '\n') appendToMessage('\n');
                else appendToMessage(char);
              }}
              onOpenPhrases={() => setView('phrases')}
            />
          )}
          {view === 'phrases' && (
            <QuickPhrases
              onSelect={(text) => appendToMessage(text)}
              onBack={() => setView('keyboard')}
            />
          )}
        </div>
        <div style={{ gridRow: 2, gridColumn: 2 }}>
          <Sidebar
            messageText={messageText}
            clearMessage={clearMessage}
            backspaceMessage={backspaceMessage}
          />
        </div>
      </div>
    </>
  );
});
