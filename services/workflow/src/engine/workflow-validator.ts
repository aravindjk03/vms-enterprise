import type {
  WorkflowVersion,
  WorkflowStage,
  WorkflowTransition,
  WorkflowValidationDiagnostic,
  WorkflowValidationResult,
} from '@vms/types';

export class WorkflowValidator {
  /**
   * Performs rigorous static analysis on a WorkflowVersion definition (Section 14).
   */
  public validate(version: WorkflowVersion): WorkflowValidationResult {
    const diagnostics: WorkflowValidationDiagnostic[] = [];
    const stages = version.stages || [];
    const transitions = version.transitions || [];

    const stageMap = new Map<string, WorkflowStage>();
    stages.forEach((s) => stageMap.set(s.stageId, s));

    // 1. Exactly one valid START stage
    const startStages = stages.filter((s) => s.stageType === 'START');
    if (startStages.length === 0) {
      diagnostics.push({
        severity: 'ERROR',
        code: 'MISSING_START_STAGE',
        message: 'Workflow definition must contain exactly one START stage.',
      });
    } else if (startStages.length > 1) {
      diagnostics.push({
        severity: 'ERROR',
        code: 'MULTIPLE_START_STAGES',
        message: `Workflow definition contains ${startStages.length} START stages; only 1 is permitted.`,
      });
    }

    // 2. At least one reachable END stage
    const endStages = stages.filter((s) => s.stageType === 'END');
    if (endStages.length === 0) {
      diagnostics.push({
        severity: 'ERROR',
        code: 'MISSING_END_STAGE',
        message: 'Workflow definition must contain at least one terminal END stage.',
      });
    }

    // 3. Broken Transitions & Invalid Stage References
    for (const t of transitions) {
      if (!stageMap.has(t.fromStageId)) {
        diagnostics.push({
          severity: 'ERROR',
          transitionId: t.transitionId,
          code: 'INVALID_FROM_STAGE',
          message: `Transition '${t.transitionId}' references non-existent source stage '${t.fromStageId}'.`,
        });
      }
      if (!stageMap.has(t.toStageId)) {
        diagnostics.push({
          severity: 'ERROR',
          transitionId: t.transitionId,
          code: 'INVALID_TO_STAGE',
          message: `Transition '${t.transitionId}' references non-existent destination stage '${t.toStageId}'.`,
        });
      }
      if (!t.trigger || t.trigger.trim().length === 0) {
        diagnostics.push({
          severity: 'ERROR',
          transitionId: t.transitionId,
          code: 'MISSING_TRANSITION_TRIGGER',
          message: `Transition '${t.transitionId}' is missing mandatory trigger action.`,
        });
      }
    }

    // 4. Reachability analysis from START
    if (startStages.length === 1) {
      const startId = startStages[0].stageId;
      const reachableFromStart = new Set<string>();
      const queue = [startId];
      reachableFromStart.add(startId);

      while (queue.length > 0) {
        const curr = queue.shift()!;
        const outgoing = transitions.filter((t) => t.fromStageId === curr);
        for (const out of outgoing) {
          if (!reachableFromStart.has(out.toStageId) && stageMap.has(out.toStageId)) {
            reachableFromStart.add(out.toStageId);
            queue.push(out.toStageId);
          }
        }
      }

      for (const s of stages) {
        if (!reachableFromStart.has(s.stageId)) {
          diagnostics.push({
            severity: 'ERROR',
            stageId: s.stageId,
            code: 'UNREACHABLE_STAGE',
            message: `Stage '${s.stageName}' (${s.stageId}) cannot be reached from START stage.`,
          });
        }
      }

      // Check if at least one END stage is reachable
      const reachableEnd = endStages.some((es) => reachableFromStart.has(es.stageId));
      if (!reachableEnd && endStages.length > 0) {
        diagnostics.push({
          severity: 'ERROR',
          code: 'UNREACHABLE_END_STAGE',
          message: 'No terminal END stage is reachable from the START stage.',
        });
      }
    }

    // 5. Approval stage configuration check
    for (const s of stages) {
      if (s.stageType === 'APPROVAL') {
        if (!s.approvalPolicy) {
          diagnostics.push({
            severity: 'ERROR',
            stageId: s.stageId,
            code: 'MISSING_APPROVAL_POLICY',
            message: `Approval stage '${s.stageName}' must define an approvalPolicy (e.g., SINGLE, SEQUENTIAL, PARALLEL_ALL_REQUIRED).`,
          });
        }
        if (!s.assignmentRules || s.assignmentRules.length === 0) {
          diagnostics.push({
            severity: 'ERROR',
            stageId: s.stageId,
            code: 'MISSING_ASSIGNMENT_RULES',
            message: `Approval stage '${s.stageName}' must have at least one approver assignment rule.`,
          });
        }
      }
    }

    // 6. Terminal END stage cannot have outgoing transitions
    for (const es of endStages) {
      const outgoing = transitions.filter((t) => t.fromStageId === es.stageId);
      if (outgoing.length > 0) {
        diagnostics.push({
          severity: 'ERROR',
          stageId: es.stageId,
          code: 'OUTGOING_FROM_END_STAGE',
          message: `Terminal END stage '${es.stageName}' cannot possess outgoing transitions.`,
        });
      }
    }

    // 7. Non-END stages must have at least one outgoing transition
    for (const s of stages) {
      if (s.stageType !== 'END') {
        const outgoing = transitions.filter((t) => t.fromStageId === s.stageId);
        if (outgoing.length === 0) {
          diagnostics.push({
            severity: 'ERROR',
            stageId: s.stageId,
            code: 'DEAD_END_STAGE',
            message: `Stage '${s.stageName}' has no outgoing transitions and is not an END stage.`,
          });
        }
      }
    }

    // 8. Cycle detection (ensure loops have termination / conditions)
    this.detectUnboundedCycles(stages, transitions, diagnostics);

    const hasErrors = diagnostics.some((d) => d.severity === 'ERROR');
    return {
      isValid: !hasErrors,
      diagnostics,
    };
  }

  /**
   * Cycle analysis to detect infinite loops without exit transitions.
   */
  private detectUnboundedCycles(
    stages: WorkflowStage[],
    transitions: WorkflowTransition[],
    diagnostics: WorkflowValidationDiagnostic[]
  ): void {
    const adj = new Map<string, string[]>();
    for (const s of stages) {
      adj.set(s.stageId, []);
    }
    for (const t of transitions) {
      adj.get(t.fromStageId)?.push(t.toStageId);
    }

    const visited = new Set<string>();
    const recStack = new Set<string>();

    const dfs = (node: string, path: string[]) => {
      visited.add(node);
      recStack.add(node);

      const neighbors = adj.get(node) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          dfs(neighbor, [...path, neighbor]);
        } else if (recStack.has(neighbor)) {
          // Found a cycle!
          // Check if any transition in the cycle has conditions (bounded loop)
          const cycleNodes = path.slice(path.indexOf(neighbor));
          let hasConditionalExit = false;
          for (const cn of cycleNodes) {
            const outTrans = transitions.filter((t) => t.fromStageId === cn);
            // Has an exit leading outside the cycle?
            if (outTrans.some((t) => !cycleNodes.includes(t.toStageId))) {
              hasConditionalExit = true;
              break;
            }
          }

          if (!hasConditionalExit) {
            diagnostics.push({
              severity: 'ERROR',
              stageId: node,
              code: 'INFINITE_CYCLE_DETECTED',
              message: `Unbounded infinite cycle detected through stages: ${cycleNodes.join(' -> ')} with no valid exit path.`,
            });
          }
        }
      }

      recStack.delete(node);
    };

    for (const s of stages) {
      if (!visited.has(s.stageId)) {
        dfs(s.stageId, [s.stageId]);
      }
    }
  }
}
