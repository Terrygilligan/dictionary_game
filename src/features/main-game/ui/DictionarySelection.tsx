import { useState } from 'react';
import { Button } from '@/shared/ui/Button';
import { useDealerVoice } from '@/shared/lib/speech/useDealerVoice';
import { useTranslate } from '@/shared/lib/i18n/useTranslate';

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
  const { t } = useTranslate();
  
  // Initialize dealer voice for TTS announcements
  useDealerVoice(state, []); // Pass empty eventLog for now, will be connected later

  const handleDispatch = (commandType: MainGameCommand['type'], payload: Record<string, any> = {}) => {
    dispatch({ type: commandType, payload });
  };

  if (phase === 'idle') {
    return (
      <div className="selection-container" aria-live="polite">
        <h2>{t('dictionaryDealer.title')}</h2>
        <Button onClick={() => handleDispatch('startGame')}>
          {t('dictionaryDealer.startGame')}
        </Button>
      </div>
    );
  }

  return (
    <div className="selection-container" aria-live="polite">
      <h2>{t('dictionaryDealer.title')}</h2>
      
      {phase === 'scroll' && (
        <div className="scroll-phase">
          <p>{t('dictionaryDealer.flickingSections')}</p>
          <Button onClick={() => handleDispatch('selectScroll', { section: 'A-D' })}>
            {t('dictionaryDealer.stop')}
          </Button>
        </div>
      )}

      {phase === 'page' && (
        <div className="page-phase">
          <p>{t('dictionaryDealer.pageSelected')}</p>
          <Button onClick={() => handleDispatch('selectPage', { side: 'left' })}>
            {t('dictionaryDealer.left')}
          </Button>
          <Button onClick={() => handleDispatch('selectPage', { side: 'right' })}>
            {t('dictionaryDealer.right')}
          </Button>
        </div>
      )}

      {phase === 'column' && (
        <div className="column-phase">
          <p>{t('dictionaryDealer.whichColumn')}</p>
          <Button onClick={() => handleDispatch('selectColumn', { side: 'left' })}>
            {t('dictionaryDealer.left')}
          </Button>
          <Button onClick={() => handleDispatch('selectColumn', { side: 'right' })}>
            {t('dictionaryDealer.right')}
          </Button>
        </div>
      )}

      {phase === 'wordNumber' && (
        <div className="number-phase">
          <p>{t('dictionaryDealer.whichWordNumber')}</p>
          <input 
            type="number" 
            placeholder={t('dictionaryDealer.enterWordNumber')} 
            onChange={(e) => setTempSelection(parseInt(e.target.value) || null)} 
            aria-label="Word number input"
          />
          <Button 
            onClick={() => handleDispatch('selectWordNumber', { number: tempSelection })}
            disabled={tempSelection === null}
          >
            {t('dictionaryDealer.confirm')}
          </Button>
        </div>
      )}

      {phase === 'ready' && (
        <div className="seal-phase">
          <p>{t('dictionaryDealer.wordCoordinatesLocked')}</p>
          <Button onClick={() => handleDispatch('sealWord')}>
            {t('dictionaryDealer.sealWord')}
          </Button>
        </div>
      )}

      {phase === 'sealed' && (
        <div className="reveal-phase">
          <p>{t('dictionaryDealer.dealerReady')}</p>
          <Button onClick={() => handleDispatch('revealWord')}>
            {t('dictionaryDealer.revealWord')}
          </Button>
        </div>
      )}

      {phase === 'revealed' && (
        <div className="completed-phase">
          <p>{t('dictionaryDealer.wordRevealed')}</p>
          <Button onClick={() => handleDispatch('startGame')}>
            {t('dictionaryDealer.playAgain')}
          </Button>
        </div>
      )}
    </div>
  );
};
