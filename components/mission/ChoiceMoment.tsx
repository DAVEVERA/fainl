import { FC } from 'react';
import { CircleCheck, Gavel, Swords, PenLine } from 'lucide-react';

interface ChoiceMomentProps {
  memberCount: number;
  onGetVerdict: () => void;
  onOpenDebate: () => void;
  onOpenComposition: () => void;
  onRestart: () => void;
}

export const ChoiceMoment: FC<ChoiceMomentProps> = ({
  memberCount,
  onGetVerdict,
  onOpenDebate,
  onOpenComposition,
  onRestart,
}) => {
  return (
    <div className="choice-moment animate-fade-in-up">
      {/* Milestone banner */}
      <div className="choice-moment__milestone">
        <span className="badge">
          <CircleCheck className="w-3.5 h-3.5" /> Alle {memberCount} analyses zijn binnen
        </span>
      </div>

      <div className="choice-moment__actions">
        {/* Primary CTA */}
        <button
          type="button"
          onClick={onGetVerdict}
          className="choice-moment__primary btn-send"
        >
          <span className="choice-moment__primary-row">
            <Gavel className="w-5 h-5" />
            Victor's eindoordeel ophalen
          </span>
          <span className="choice-moment__primary-sub">
            Voorzitter Victor weegt alle analyses en levert het definitieve advies
          </span>
        </button>

        {/* Divider */}
        <p className="choice-moment__divider">of verdiep je eerst</p>

        {/* Secondary row */}
        <div className="choice-moment__secondary">
          <button
            type="button"
            onClick={onOpenDebate}
            className="choice-moment__secondary-btn btn-ghost"
          >
            <span className="choice-moment__secondary-row">
              <Swords className="w-4 h-4" />
              Live debat
            </span>
            <span className="choice-moment__secondary-sub">
              Laat de AI-modellen met elkaar discussieren
            </span>
          </button>
          <button
            type="button"
            onClick={onOpenComposition}
            className="choice-moment__secondary-btn btn-ghost"
          >
            <span className="choice-moment__secondary-row">
              <PenLine className="w-4 h-4" />
              Compositie
            </span>
            <span className="choice-moment__secondary-sub">
              Stel zelf het eindadvies samen uit de analyses
            </span>
          </button>
        </div>

        {/* Tertiary */}
        <button
          type="button"
          onClick={onRestart}
          className="choice-moment__tertiary"
        >
          Vraag aanpassen en opnieuw starten
        </button>
      </div>
    </div>
  );
};
