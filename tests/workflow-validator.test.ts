import { describe, it } from 'node:test';
import assert from 'node:assert';
import type { WorkflowVersion, WorkflowStage, WorkflowTransition } from '@vms/types';
import { WorkflowValidator } from '../services/workflow/src/engine/workflow-validator.js';

describe('Part 5: WorkflowValidator Static Analysis (Section 14)', () => {
  const validator = new WorkflowValidator();

  const createMinimalValidVersion = (): WorkflowVersion => ({
    versionId: 'ver-01',
    definitionId: 'def-01',
    versionNumber: 1,
    status: 'DRAFT',
    stages: [
      { stageId: 's-start', stageCode: 'START', stageName: 'Start', stageType: 'START', orderIndex: 0 },
      { stageId: 's-end', stageCode: 'END', stageName: 'End', stageType: 'END', orderIndex: 1 },
    ],
    transitions: [
      { transitionId: 't-01', fromStageId: 's-start', toStageId: 's-end', trigger: 'COMPLETE' },
    ],
    immutable: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  it('1. Passes valid minimal workflow with 1 START and 1 END', () => {
    const v = createMinimalValidVersion();
    const result = validator.validate(v);
    assert.strictEqual(result.isValid, true);
    assert.strictEqual(result.diagnostics.length, 0);
  });

  it('2. Flags missing START stage', () => {
    const v = createMinimalValidVersion();
    v.stages = v.stages.filter((s) => s.stageType !== 'START');
    const result = validator.validate(v);
    assert.strictEqual(result.isValid, false);
    assert.ok(result.diagnostics.some((d) => d.code === 'MISSING_START_STAGE'));
  });

  it('3. Flags multiple START stages', () => {
    const v = createMinimalValidVersion();
    v.stages.push({ stageId: 's-start-2', stageCode: 'START_2', stageName: 'Second Start', stageType: 'START', orderIndex: 2 });
    v.transitions.push({ transitionId: 't-02', fromStageId: 's-start-2', toStageId: 's-end', trigger: 'COMPLETE' });
    const result = validator.validate(v);
    assert.strictEqual(result.isValid, false);
    assert.ok(result.diagnostics.some((d) => d.code === 'MULTIPLE_START_STAGES'));
  });

  it('4. Flags missing END stage', () => {
    const v = createMinimalValidVersion();
    v.stages = v.stages.filter((s) => s.stageType !== 'END');
    const result = validator.validate(v);
    assert.strictEqual(result.isValid, false);
    assert.ok(result.diagnostics.some((d) => d.code === 'MISSING_END_STAGE'));
  });

  it('5. Flags broken transitions referencing non-existent stages', () => {
    const v = createMinimalValidVersion();
    v.transitions.push({
      transitionId: 't-broken-from',
      fromStageId: 'non-existent-source',
      toStageId: 's-end',
      trigger: 'NEXT',
    });
    v.transitions.push({
      transitionId: 't-broken-to',
      fromStageId: 's-start',
      toStageId: 'non-existent-dest',
      trigger: 'NEXT',
    });

    const result = validator.validate(v);
    assert.strictEqual(result.isValid, false);
    assert.ok(result.diagnostics.some((d) => d.code === 'INVALID_FROM_STAGE'));
    assert.ok(result.diagnostics.some((d) => d.code === 'INVALID_TO_STAGE'));
  });

  it('6. Flags transition with missing trigger action', () => {
    const v = createMinimalValidVersion();
    v.transitions[0].trigger = '   ';
    const result = validator.validate(v);
    assert.strictEqual(result.isValid, false);
    assert.ok(result.diagnostics.some((d) => d.code === 'MISSING_TRANSITION_TRIGGER'));
  });

  it('7. Flags unreachable stages from START', () => {
    const v = createMinimalValidVersion();
    v.stages.push({
      stageId: 's-island',
      stageCode: 'ISLAND',
      stageName: 'Isolated Stage',
      stageType: 'DATA_VALIDATION',
      orderIndex: 2,
    });
    v.transitions.push({
      transitionId: 't-island-out',
      fromStageId: 's-island',
      toStageId: 's-end',
      trigger: 'NEXT',
    });

    const result = validator.validate(v);
    assert.strictEqual(result.isValid, false);
    assert.ok(result.diagnostics.some((d) => d.code === 'UNREACHABLE_STAGE' && d.stageId === 's-island'));
  });

  it('8. Flags unreachable terminal END stage from START', () => {
    const v = createMinimalValidVersion();
    v.stages.push({
      stageId: 's-unreachable-end',
      stageCode: 'UNREACHABLE_END',
      stageName: 'Unreachable End',
      stageType: 'END',
      orderIndex: 2,
    });
    // Break connection to both ends
    v.transitions = [
      { transitionId: 't-loop', fromStageId: 's-start', toStageId: 's-start', trigger: 'SELF' }
    ];

    const result = validator.validate(v);
    assert.strictEqual(result.isValid, false);
    assert.ok(result.diagnostics.some((d) => d.code === 'UNREACHABLE_END_STAGE'));
  });

  it('9. Flags dead end stage (non-END stage without outgoing transitions)', () => {
    const v = createMinimalValidVersion();
    v.stages.push({
      stageId: 's-dead',
      stageCode: 'DEAD_END',
      stageName: 'Dead End Intermediate',
      stageType: 'DATA_VALIDATION',
      orderIndex: 2,
    });
    // Connect start to dead end, but dead end has no outgoing transition
    v.transitions.push({
      transitionId: 't-to-dead',
      fromStageId: 's-start',
      toStageId: 's-dead',
      trigger: 'TO_DEAD',
    });

    const result = validator.validate(v);
    assert.strictEqual(result.isValid, false);
    assert.ok(result.diagnostics.some((d) => d.code === 'DEAD_END_STAGE' && d.stageId === 's-dead'));
  });

  it('10. Flags outgoing transitions from terminal END stage', () => {
    const v = createMinimalValidVersion();
    v.transitions.push({
      transitionId: 't-illegal-outgoing',
      fromStageId: 's-end',
      toStageId: 's-start',
      trigger: 'RESTART',
    });

    const result = validator.validate(v);
    assert.strictEqual(result.isValid, false);
    assert.ok(result.diagnostics.some((d) => d.code === 'OUTGOING_FROM_END_STAGE' && d.stageId === 's-end'));
  });

  it('11. Flags APPROVAL stage with missing approval policy or assignment rules', () => {
    const v = createMinimalValidVersion();
    v.stages.splice(1, 0, {
      stageId: 's-appr',
      stageCode: 'APPROVAL_STEP',
      stageName: 'Manager Sign-off',
      stageType: 'APPROVAL',
      orderIndex: 1,
      // Missing approvalPolicy and assignmentRules
    });
    v.transitions = [
      { transitionId: 't-1', fromStageId: 's-start', toStageId: 's-appr', trigger: 'SUBMIT' },
      { transitionId: 't-2', fromStageId: 's-appr', toStageId: 's-end', trigger: 'APPROVE' },
    ];

    const result = validator.validate(v);
    assert.strictEqual(result.isValid, false);
    assert.ok(result.diagnostics.some((d) => d.code === 'MISSING_APPROVAL_POLICY'));
    assert.ok(result.diagnostics.some((d) => d.code === 'MISSING_ASSIGNMENT_RULES'));
  });

  it('12. Unbounded cycle detection flags infinite loops without exit', () => {
    const v: WorkflowVersion = {
      versionId: 'ver-cycle',
      definitionId: 'def-cycle',
      versionNumber: 1,
      status: 'DRAFT',
      stages: [
        { stageId: 's-start', stageCode: 'START', stageName: 'Start', stageType: 'START', orderIndex: 0 },
        { stageId: 's-loop1', stageCode: 'LOOP1', stageName: 'Loop 1', stageType: 'DATA_VALIDATION', orderIndex: 1 },
        { stageId: 's-loop2', stageCode: 'LOOP2', stageName: 'Loop 2', stageType: 'DATA_VALIDATION', orderIndex: 2 },
        { stageId: 's-end', stageCode: 'END', stageName: 'End', stageType: 'END', orderIndex: 3 },
      ],
      transitions: [
        { transitionId: 't-1', fromStageId: 's-start', toStageId: 's-loop1', trigger: 'BEGIN' },
        // Cycle between loop1 and loop2 with NO exit to s-end!
        { transitionId: 't-c1', fromStageId: 's-loop1', toStageId: 's-loop2', trigger: 'LOOP_FWD' },
        { transitionId: 't-c2', fromStageId: 's-loop2', toStageId: 's-loop1', trigger: 'LOOP_REV' },
      ],
      immutable: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = validator.validate(v);
    assert.strictEqual(result.isValid, false);
    assert.ok(result.diagnostics.some((d) => d.code === 'INFINITE_CYCLE_DETECTED'));
  });

  it('13. Permitted bounded cycles with valid exit transitions pass analysis', () => {
    const v: WorkflowVersion = {
      versionId: 'ver-bounded-cycle',
      definitionId: 'def-bounded-cycle',
      versionNumber: 1,
      status: 'DRAFT',
      stages: [
        { stageId: 's-start', stageCode: 'START', stageName: 'Start', stageType: 'START', orderIndex: 0 },
        {
          stageId: 's-appr',
          stageCode: 'APPROVAL',
          stageName: 'Approval',
          stageType: 'APPROVAL',
          orderIndex: 1,
          approvalPolicy: 'SINGLE',
          assignmentRules: [{ approverType: 'ROLE', targetRole: 'SITE_ADMIN' }],
        },
        { stageId: 's-revise', stageCode: 'REVISE', stageName: 'Revise Data', stageType: 'DATA_VALIDATION', orderIndex: 2 },
        { stageId: 's-end', stageCode: 'END', stageName: 'End', stageType: 'END', orderIndex: 3 },
      ],
      transitions: [
        { transitionId: 't-start', fromStageId: 's-start', toStageId: 's-appr', trigger: 'SUBMIT' },
        // Loop back to revise
        { transitionId: 't-req-chg', fromStageId: 's-appr', toStageId: 's-revise', trigger: 'CHANGES_REQUIRED' },
        { transitionId: 't-resubmit', fromStageId: 's-revise', toStageId: 's-appr', trigger: 'RESUBMIT' },
        // Valid exit to END
        { transitionId: 't-approve', fromStageId: 's-appr', toStageId: 's-end', trigger: 'APPROVE' },
      ],
      immutable: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = validator.validate(v);
    assert.strictEqual(result.isValid, true);
    assert.strictEqual(result.diagnostics.length, 0);
  });
});
