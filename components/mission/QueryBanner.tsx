import { FC } from 'react';
import { PenLine } from 'lucide-react';
import { WorkflowStage } from '../../types';

interface QueryBannerProps {
  query: string;
  stage: WorkflowStage;
  onCancel: () => void;
}

export const QueryBanner: FC<QueryBannerProps> = ({ query, stage, onCancel }) => {
  return (
    <div className="query-banner">
      <p className="query-banner__label">Jouw vraag aan de raad</p>
      <blockquote className="query-banner__text">"{query}"</blockquote>
      {stage === WorkflowStage.PROCESSING_COUNCIL && (
        <button
          type="button"
          onClick={() => {
            if (!window.confirm('Weet je zeker dat je de lopende analyse wilt annuleren?')) return;
            onCancel();
          }}
          className="query-banner__edit"
          title="Vraag aanpassen"
          aria-label="Vraag aanpassen"
        >
          <PenLine className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
