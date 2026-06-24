import { FC } from 'react';
import { WorkflowStage } from '../../types';

const JOURNEY_STEPS: { label: string; stages: WorkflowStage[] }[] = [
  { label: 'Analyse',  stages: [WorkflowStage.PROCESSING_COUNCIL] },
  { label: 'Keuze',    stages: [WorkflowStage.DEBATE, WorkflowStage.COMPOSITION] },
  { label: 'Oordeel',  stages: [WorkflowStage.SYNTHESIZING, WorkflowStage.COMPLETED] },
];

interface JourneyStepperProps {
  stage: WorkflowStage;
}

export const JourneyStepper: FC<JourneyStepperProps> = ({ stage }) => {
  const currentIdx = JOURNEY_STEPS.findIndex(s => s.stages.includes(stage));
  const isComplete = stage === WorkflowStage.COMPLETED;

  return (
    <nav className="journey-stepper" aria-label="Voortgang sessie">
      <ol className="journey-stepper__list">
        {JOURNEY_STEPS.map((step, i) => {
          const isActive = i === currentIdx;
          const isPast = i < currentIdx || isComplete;
          const stepClass = isActive
            ? 'journey-stepper__step--active'
            : isPast
              ? 'journey-stepper__step--past'
              : 'journey-stepper__step--future';

          return (
            <li key={step.label} className="journey-stepper__item">
              <div
                className={`journey-stepper__step ${stepClass}`}
                aria-current={isActive ? 'step' : undefined}
              >
                <span className="journey-stepper__number">
                  {isPast && !isActive ? '✓' : String(i + 1)}
                </span>
                <span className="journey-stepper__label">{step.label}</span>
              </div>
              {i < JOURNEY_STEPS.length - 1 && (
                <div className={`journey-stepper__connector${isPast ? ' journey-stepper__connector--done' : ''}`} />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
