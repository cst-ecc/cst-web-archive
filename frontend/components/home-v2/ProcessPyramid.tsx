import type { ProcessPyramidStep } from "./progress-data";
import styles from "./ProcessPyramid.module.scss";

type ProcessPyramidProps = {
  steps: ProcessPyramidStep[];
  currentStep: number;
};

function getStepState(step: number, currentStep: number) {
  if (step < currentStep) return "done";
  if (step === currentStep) return "current";
  return "next";
}

export default function ProcessPyramid({
  steps,
  currentStep,
}: ProcessPyramidProps) {
  const visualSteps = [...steps].sort((a, b) => b.id - a.id);

  return (
    <ol
      className={styles.pyramid}
      aria-label="Pyramide des sept étapes du processus CST, de la mise en place du CST jusqu'au Pasteur"
    >
      {visualSteps.map((step) => {
        const state = getStepState(step.id, currentStep);
        const isCurrent = state === "current";

        return (
          <li
            key={step.id}
            className={styles.step}
            data-step={step.id}
            data-state={state}
            aria-current={isCurrent ? "step" : undefined}
          >
            <span className={styles.stepNumber} aria-hidden="true">
              {step.id}
            </span>

            <span className={styles.stepContent}>
              <span className={styles.stepTitle}>{step.title}</span>
              {isCurrent && (
                <span className={styles.currentLabel}>
                  <i aria-hidden="true" />
                  Étape en cours
                </span>
              )}
            </span>

            <span className={styles.stateMark} aria-hidden="true">
              {state === "done" ? "✓" : isCurrent ? "•" : ""}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
