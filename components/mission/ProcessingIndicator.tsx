import { FC, useState, useEffect } from 'react';
import { CouncilMember, CouncilResponse } from '../../types';

/* ---- Wait Time Indicator ------------------------------------------------ */
const WaitTimeIndicator: FC<{ startedAt: number }> = ({ startedAt }) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const id = setInterval(
      () => setElapsed(Math.floor((Date.now() - startedAt) / 1000)),
      1000,
    );
    return () => clearInterval(id);
  }, [startedAt]);

  if (elapsed < 5)
    return <span className="processing-indicator__wait">Gemiddeld 8-15 seconden</span>;
  if (elapsed < 30)
    return <span className="processing-indicator__wait">Gemiddeld 8-15 seconden &middot; {elapsed}s</span>;
  if (elapsed < 60)
    return <span className="processing-indicator__wait processing-indicator__wait--warn">Even geduld -- complexe vragen kosten meer tijd &middot; {elapsed}s</span>;
  return <span className="processing-indicator__wait processing-indicator__wait--err">Dit duurt langer dan verwacht &middot; {elapsed}s</span>;
};

/* ---- Processing Indicator ----------------------------------------------- */
interface ProcessingIndicatorProps {
  members: CouncilMember[];
  responses: CouncilResponse[];
  startedAt: number;
}

export const ProcessingIndicator: FC<ProcessingIndicatorProps> = ({
  members,
  responses,
  startedAt,
}) => {
  const done = responses.length;
  const total = members.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  // Narrative headline
  const headline =
    done === 0
      ? 'De raad buigt zich over je vraag'
      : done < total
        ? 'De eerste analyses komen binnen'
        : 'Bijna klaar';

  return (
    <div className="processing-indicator" role="status" aria-live="polite">
      <p className="processing-indicator__headline">{headline}</p>

      <div className="processing-indicator__bar" aria-hidden="true">
        <div
          className="processing-indicator__fill"
          style={{ '--pct': `${pct}%` } as React.CSSProperties}
        />
      </div>

      <span className="processing-indicator__counter">
        {done} van {total} analyses voltooid
      </span>

      <WaitTimeIndicator startedAt={startedAt} />
    </div>
  );
};
