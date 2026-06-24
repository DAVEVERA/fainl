import { FC, useState, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface ChatHomeProps {
  input: string;
  onInputChange: (val: string) => void;
  onSubmit: () => void;
  isInputFocused: boolean;
  onFocus: () => void;
  onBlur: () => void;
  turnsUsed?: number;
  totalTurnsAllowed?: number;
  creditsRemaining?: number;
  isLifetime?: boolean;
}

const MAX_LENGTH = 4000;

const placeholders = [
  "Moet ik Rust of Go leren voor backend development?",
  "Is het beter om een huis te kopen of te huren?",
  "Wat zijn de voor- en nadelen van een vierdaagse werkweek?",
  "Is thuiswerken beter voor productiviteit dan op kantoor?",
  "Welke programmeertaal kies ik voor mijn volgende project?",
  "Wat is het sterkste argument voor een basisinkomen?",
];

const FadingPlaceholder: FC<{ isFocused: boolean }> = ({ isFocused }) => {
  const [index, setIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    if (isFocused) return;
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setIndex(prev => (prev + 1) % placeholders.length);
        setFade(true);
      }, 500);
    }, 4000);
    return () => clearInterval(interval);
  }, [isFocused]);

  if (isFocused) return null;
  return (
    <span className={`transition-opacity duration-500 ${fade ? 'opacity-100' : 'opacity-0'}`}>
      {placeholders[index]}
    </span>
  );
};

export const ChatHome: FC<ChatHomeProps> = ({
  input,
  onInputChange,
  onSubmit,
  isInputFocused,
  onFocus,
  onBlur,
  turnsUsed = 0,
  totalTurnsAllowed = 2,
  creditsRemaining = 0,
  isLifetime = false,
}) => {
  const { authSession } = useAuth();

  const getGreeting = () => {
    const hour = new Date().getHours();
    const base = hour < 12 ? 'Goedemorgen' : hour < 18 ? 'Goedemiddag' : 'Goedenavond';
    const name =
      authSession?.user?.user_metadata?.name?.split(' ')[0] ||
      authSession?.user?.user_metadata?.full_name?.split(' ')[0];
    return name ? `${base}, ${name}.` : `${base}.`;
  };

  return (
    <div className="hero-center animate-up">
      <h1 className="hero-heading">{getGreeting()}</h1>
      <p className="hero-sub">
        Stel je vraag — meerdere AI-modellen debatteren en leveren één gefundeerde conclusie. Niet één mening, maar een echt antwoord.
      </p>

      {/* Free turns indicator */}
      {!isLifetime && !authSession && creditsRemaining <= 0 && totalTurnsAllowed > 0 && (
        <p className="text-xs text-zinc-400 mb-4">
          {turnsUsed < totalTurnsAllowed
            ? `${totalTurnsAllowed - turnsUsed} van ${totalTurnsAllowed} gratis sessies over`
            : 'Gratis sessies op — maak een account aan voor meer'}
        </p>
      )}

      <div className="chat-input-wrap chat-input-full">
        <div style={{ position: 'relative' }}>
          {!input && !isInputFocused && (
            <div className="placeholder-fade">
              <FadingPlaceholder isFocused={isInputFocused} />
            </div>
          )}
          <textarea
            className="chat-textarea"
            value={input}
            onChange={e => onInputChange(e.target.value.slice(0, MAX_LENGTH))}
            onFocus={onFocus}
            onBlur={onBlur}
            aria-label="Stel je vraag"
          />
        </div>
        <div className="chat-input-bar">
          <span className={`chat-counter${input.length >= MAX_LENGTH ? ' warn' : ''}`}>
            {input.length > 0 ? `${input.length} / ${MAX_LENGTH}` : ''}
          </span>
          <button
            className="btn-send"
            onClick={onSubmit}
            disabled={!input.trim()}
          >
            <Send className="send-icon" />
            Vraag stellen
          </button>
        </div>
      </div>
    </div>
  );
};
