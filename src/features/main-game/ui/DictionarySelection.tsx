import { useState } from 'react';
import { Button } from '@/shared/ui/Button';

// Types for the main game selection flow
type SelectionPhase = 'idle' | 'scroll' | 'page' | 'column' | 'wordNumber' | 'ready' | 'sealed' | 'revealed';

interface MainGameCommand {
  type: 'startGame' | 'selectScroll' | 'selectPage' | 'selectColumn' | 'selectWordNumber' | 'sealWord' | 'revealWord';
  payload?: Record<string, any>;
}

interface MainGameState {
  phase: SelectionPhase;
  // Other state properties will be added as needed
}

// Mock store interface - will be connected to actual game store
interface MockGameStore {
  state: MainGameState;
  dispatch(command: MainGameCommand): void;
}

// Mock hook - will be replaced with actual game store hook
const useMockGameStore = (): MockGameStore => {
  const [state, setState] = useState<MainGameState>({ phase: 'idle' });
  
  const dispatch = (command: MainGameCommand) => {
    console.log('Dispatching command:', command);
    // Mock state transitions
    switch (command.type) {
      case 'startGame':
        setState({ phase: 'scroll' });
        break;
      case 'selectScroll':
        setState({ phase: 'page' });
        break;
      case 'selectPage':
        setState({ phase: 'column' });
        break;
      case 'selectColumn':
        setState({ phase: 'wordNumber' });
        break;
      case 'selectWordNumber':
        setState({ phase: 'ready' });
        break;
      case 'sealWord':
        setState({ phase: 'sealed' });
        break;
      case 'revealWord':
        setState({ phase: 'revealed' });
        break;
    }
  };

  return { state, dispatch };
};

/**
 * DictionarySelection UI
 * 
 * Implements the Blind Arbiter selection flow.
 * UI acts strictly as a command dispatcher.
 */
export const DictionarySelection = () => {
  const { state, dispatch } = useMockGameStore();
  const phase = state.phase;
  const [tempSelection, setTempSelection] = useState<number | null>(null);

  const handleDispatch = (commandType: MainGameCommand['type'], payload: Record<string, any> = {}) => {
    dispatch({ type: commandType, payload });
  };

  if (phase === 'idle') {
    return (
      <div className="selection-container" aria-live="polite">
        <h2>Dictionary Dealer</h2>
        <Button onClick={() => handleDispatch('startGame')}>
          Start Main Game
        </Button>
      </div>
    );
  }

  return (
    <div className="selection-container" aria-live="polite">
      <h2>Dictionary Dealer</h2>
      
      {phase === 'scroll' && (
        <div className="scroll-phase">
          <p>Flicking through dictionary sections...</p>
          <Button onClick={() => handleDispatch('selectScroll', { section: 'A-D' })}>
            Stop!
          </Button>
        </div>
      )}

      {phase === 'page' && (
        <div className="page-phase">
          <p>Page selected. Which side?</p>
          <Button onClick={() => handleDispatch('selectPage', { side: 'left' })}>
            Left
          </Button>
          <Button onClick={() => handleDispatch('selectPage', { side: 'right' })}>
            Right
          </Button>
        </div>
      )}

      {phase === 'column' && (
        <div className="column-phase">
          <p>Which column?</p>
          <Button onClick={() => handleDispatch('selectColumn', { side: 'left' })}>
            Left
          </Button>
          <Button onClick={() => handleDispatch('selectColumn', { side: 'right' })}>
            Right
          </Button>
        </div>
      )}

      {phase === 'wordNumber' && (
        <div className="number-phase">
          <p>Approximately which word number?</p>
          <input 
            type="number" 
            placeholder="Enter word number" 
            onChange={(e) => setTempSelection(parseInt(e.target.value) || null)} 
            aria-label="Word number input"
          />
          <Button 
            onClick={() => handleDispatch('selectWordNumber', { number: tempSelection })}
            disabled={tempSelection === null}
          >
            Confirm
          </Button>
        </div>
      )}

      {phase === 'ready' && (
        <div className="seal-phase">
          <p>Word coordinates locked.</p>
          <Button onClick={() => handleDispatch('sealWord')}>
            Seal Word
          </Button>
        </div>
      )}

      {phase === 'sealed' && (
        <div className="reveal-phase">
          <p>The Dealer is ready.</p>
          <Button onClick={() => handleDispatch('revealWord')}>
            Reveal Word (TTS)
          </Button>
        </div>
      )}

      {phase === 'revealed' && (
        <div className="completed-phase">
          <p>Word revealed!</p>
          <Button onClick={() => handleDispatch('startGame')}>
            Play Again
          </Button>
        </div>
      )}
    </div>
  );
};
