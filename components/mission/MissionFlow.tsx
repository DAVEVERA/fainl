import { FC } from 'react';
import {
  SessionState,
  AppConfig,
  CouncilMember,
  WorkflowStage,
} from '../../types';
import { JourneyStepper } from './JourneyStepper';
import { QueryBanner } from './QueryBanner';
import { ProcessingIndicator } from './ProcessingIndicator';
import { ChoiceMoment } from './ChoiceMoment';
import { VerdictPanel } from './VerdictPanel';
import { CompletionActions } from './CompletionActions';
import { CouncilCard } from '../CouncilCard';
import { CompositionStage } from '../CompositionStage';

interface MissionFlowProps {
  session: SessionState;
  config: AppConfig;
  chairman: CouncilMember;
  expandedCards: Set<string>;
  processingStartedAt: number;
  isLoggedIn: boolean;
  turnsUsed: number;
  // Refs
  councilRef: React.RefObject<HTMLDivElement | null>;
  debateChoiceRef: React.RefObject<HTMLDivElement | null>;
  compositionRef: React.RefObject<HTMLDivElement | null>;
  verdictRef: React.RefObject<HTMLDivElement | null>;
  // Callbacks
  onToggleCard: (memberId: string) => void;
  onCancel: () => void;
  onGetVerdict: () => void;
  onOpenDebate: () => void;
  onOpenComposition: () => void;
  onRestart: () => void;
  onCompose: (text: string) => void;
  onNewQuestion: () => void;
  onCookbook: () => void;
  onLogin: () => void;
}

export const MissionFlow: FC<MissionFlowProps> = ({
  session,
  config,
  chairman,
  expandedCards,
  processingStartedAt,
  isLoggedIn,
  turnsUsed,
  councilRef,
  debateChoiceRef,
  compositionRef,
  verdictRef,
  onToggleCard,
  onCancel,
  onGetVerdict,
  onOpenDebate,
  onOpenComposition,
  onRestart,
  onCompose,
  onNewQuestion,
  onCookbook,
  onLogin,
}) => {
  const { stage } = session;

  return (
    <div className="mission-flow animate-fade-in-up">
      {/* 1. Journey stepper */}
      <JourneyStepper stage={stage} />

      {/* 2. Query banner */}
      <QueryBanner query={session.query} stage={stage} onCancel={onCancel} />

      {/* 3. Processing indicator */}
      {stage === WorkflowStage.PROCESSING_COUNCIL && (
        <ProcessingIndicator
          members={config.activeCouncil}
          responses={session.councilResponses}
          startedAt={processingStartedAt}
        />
      )}

      {/* 4. Council cards grid */}
      <div ref={councilRef} className="council-grid">
        {config.activeCouncil.map((member) => (
          <CouncilCard
            key={member.id}
            member={member}
            response={session.councilResponses.find(
              (r) => r.memberId === member.id,
            )}
            isLoading={
              stage === WorkflowStage.PROCESSING_COUNCIL &&
              !session.councilResponses.find((r) => r.memberId === member.id)
            }
            isExpanded={expandedCards.has(member.id)}
            onToggle={() => onToggleCard(member.id)}
          />
        ))}
      </div>

      {/* 5. Choice moment */}
      {stage === WorkflowStage.DEBATE && (
        <div ref={debateChoiceRef}>
          <ChoiceMoment
            memberCount={config.activeCouncil.length}
            onGetVerdict={onGetVerdict}
            onOpenDebate={onOpenDebate}
            onOpenComposition={onOpenComposition}
            onRestart={onRestart}
          />
        </div>
      )}

      {/* 6. Composition stage */}
      {stage === WorkflowStage.COMPOSITION && (
        <div ref={compositionRef}>
          <CompositionStage
            responses={session.councilResponses}
            members={config.activeCouncil}
            onCompose={onCompose}
          />
        </div>
      )}

      {/* 7. Verdict panel */}
      {(stage === WorkflowStage.SYNTHESIZING || stage === WorkflowStage.COMPLETED) && (
        <VerdictPanel
          stage={stage}
          synthesis={session.synthesis}
          chairman={chairman}
          memberCount={config.activeCouncil.length}
          verdictRef={verdictRef}
        />
      )}

      {/* 8. Completion actions */}
      {stage === WorkflowStage.COMPLETED && (
        <CompletionActions
          sessionId={session.id}
          query={session.query}
          synthesis={session.synthesis}
          isLoggedIn={isLoggedIn}
          turnsUsed={turnsUsed}
          onNewQuestion={onNewQuestion}
          onCookbook={onCookbook}
          onLogin={onLogin}
        />
      )}
    </div>
  );
};
