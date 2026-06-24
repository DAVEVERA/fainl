import { FC } from 'react';
import { Gavel, Loader2, Users, Shield, CircleCheck } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { WorkflowStage, CouncilMember } from '../../types';

/* ---- Score parser ------------------------------------------------------- */
export const parseVerdictScores = (
  text: string,
): { consensus: number | null; confidence: number | null; cleanText: string } => {
  let consensus: number | null = null;
  let confidence: number | null = null;
  let cleanText = text;

  const consensusMatch = cleanText.match(/<CONSENSUS_SCORE>(\d{1,3})<\/CONSENSUS_SCORE>/);
  if (consensusMatch) {
    consensus = Math.min(100, Math.max(0, parseInt(consensusMatch[1], 10)));
    cleanText = cleanText.replace(consensusMatch[0], '');
  }
  const confidenceMatch = cleanText.match(/<CONFIDENCE_SCORE>(\d{1,3})<\/CONFIDENCE_SCORE>/);
  if (confidenceMatch) {
    confidence = Math.min(100, Math.max(0, parseInt(confidenceMatch[1], 10)));
    cleanText = cleanText.replace(confidenceMatch[0], '');
  }

  return { consensus, confidence, cleanText: cleanText.trimStart() };
};

/* ---- Score bar ---------------------------------------------------------- */
const ScoreBar: FC<{ label: string; value: number; icon: React.ReactNode }> = ({
  label,
  value,
  icon,
}) => (
  <div className="verdict-scores__bar">
    <div className="verdict-scores__meta">
      {icon}
      <span className="verdict-scores__label">{label}</span>
      <span className="verdict-scores__value">{value}%</span>
    </div>
    <div className="verdict-scores__track">
      <div
        className="verdict-scores__fill"
        style={{ '--pct': `${value}%` } as React.CSSProperties}
      />
    </div>
  </div>
);

/* ---- Verdict Panel ------------------------------------------------------ */
interface VerdictPanelProps {
  stage: WorkflowStage;
  synthesis: string;
  chairman: CouncilMember;
  memberCount: number;
  verdictRef: React.RefObject<HTMLDivElement | null>;
}

export const VerdictPanel: FC<VerdictPanelProps> = ({
  stage,
  synthesis,
  chairman,
  memberCount,
  verdictRef,
}) => {
  const { consensus, confidence, cleanText } = synthesis
    ? parseVerdictScores(synthesis)
    : { consensus: null, confidence: null, cleanText: '' };

  return (
    <div
      ref={verdictRef}
      tabIndex={-1}
      aria-label="Eindoordeel van Voorzitter Victor"
      className="verdict-panel"
    >
      {/* Header */}
      <div className="verdict-header">
        <div className="verdict-header__avatar">
          <img
            src={chairman.avatar}
            alt="Victor"
            className="verdict-header__avatar-img"
            width={56}
            height={56}
          />
        </div>
        <div className="verdict-header__text">
          <p className="verdict-header__supra">Eindoordeel van de Raad</p>
          <h3 className="verdict-header__name">
            <Gavel className="w-5 h-5" />
            Voorzitter Victor
          </h3>
        </div>
        {stage === WorkflowStage.SYNTHESIZING && (
          <div className="verdict-header__status">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="verdict-header__status-text">Verwerken...</span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="verdict-body">
        {synthesis ? (
          <>
            {(consensus !== null || confidence !== null) && (
              <div className="verdict-scores">
                {consensus !== null && (
                  <ScoreBar
                    label="Consensus"
                    value={consensus}
                    icon={<Users className="w-4 h-4" />}
                  />
                )}
                {confidence !== null && (
                  <ScoreBar
                    label="Vertrouwen"
                    value={confidence}
                    icon={<Shield className="w-4 h-4" />}
                  />
                )}
              </div>
            )}
            <div className="verdict-body__prose">
              <ReactMarkdown>{cleanText}</ReactMarkdown>
            </div>
          </>
        ) : (
          <div className="verdict-body__skeleton">
            <p className="verdict-body__skeleton-label">Victor stelt het oordeel op...</p>
            <div className="verdict-body__skeleton-scores">
              <div className="verdict-body__skeleton-col">
                <div className="skeleton skeleton--label-sm" />
                <div className="skeleton skeleton--bar" />
              </div>
              <div className="verdict-body__skeleton-col">
                <div className="skeleton skeleton--label-md" />
                <div className="skeleton skeleton--bar" />
              </div>
            </div>
            <div className="skeleton skeleton--heading" />
            <div className="skeleton skeleton--line-full" />
            <div className="skeleton skeleton--line-85" />
            <div className="skeleton skeleton--line-60" />
          </div>
        )}
      </div>

      {/* Footer */}
      {stage === WorkflowStage.COMPLETED && synthesis && (
        <div className="verdict-footer">
          <CircleCheck className="w-4 h-4 verdict-footer__icon" />
          <span className="verdict-footer__text">
            Klaar -- {memberCount} AI-modellen gehoord &middot; Voorzitter Victor heeft geoordeeld
          </span>
        </div>
      )}
    </div>
  );
};
