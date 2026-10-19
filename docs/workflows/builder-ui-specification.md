# Workflow Builder UI Specification & UX Architecture

## 1. Executive Summary

The Workflow Builder UI provides an interactive visual environment enabling facility administrators and security managers to construct, inspect, validate, and publish domain workflows. It replaces code-based workflow modifications with an intuitive 3-pane layout: Stage Palette, Visual Canvas, and Right-Hand Inspector Panel.

---

## 2. 3-Pane UX Layout Architecture

```mermaid
graph LR
    subgraph Pane 1: Stage Palette
        P1[START Stage]
        P2[DATA_VALIDATION Stage]
        P3[APPROVAL Stage]
        P4[DOCUMENT_VERIFICATION Stage]
        P5[SAFETY_CHECK Stage]
        P6[ACCESS_DECISION Stage]
        P7[OPERATIONAL_TASK Stage]
        P8[END Stage]
    end

    subgraph Pane 2: Visual Workflow Canvas
        C1[Stage 1: Registration] -->|SUBMIT| C2[Stage 2: Validation]
        C2 -->|VALID| C3[Stage 3: Host Approval]
        C3 -->|APPROVE| C4[Stage 4: Security Check]
        C4 -->|APPROVE| C5[Stage 5: Access Ready]
        C3 -->|REJECT| CR[Stage 6: Rejected End]
    end

    subgraph Pane 3: Inspector Panel
        I1[Stage Name & Code Editor]
        I2[Approval Policy Selector<br/>SINGLE / SEQUENTIAL / PARALLEL]
        I3[Approver Assignment Rules<br/>Role / Named User / Host]
        I4[SLA Minutes & Warning Thresholds]
        I5[Transition Triggers & Condition Matrix]
    end

    P3 -.->|Add Stage| C3
    C3 -.->|Select Stage| Pane 3
```

---

## 3. Interaction Mechanics & Behavioral Rules

### 3.1 Interactive Canvas
- **Selection**: Clicking any stage highlights its border and populates the Right-Hand Inspector Panel.
- **Stage Ordering**: Displays stages sequentially with numbered badges and outgoing transitions.
- **Transition Connectors**: Renders outbound triggers (e.g. `APPROVE`, `REJECT`, `SUBMIT`) with conditional count badges.

### 3.2 Right-Hand Inspector Panel
1. **General Parameters**: Name, Code, Type, and Mandatory flag.
2. **Approval Configuration** (for `APPROVAL` stages):
   - **Policy**: `SINGLE`, `SEQUENTIAL`, `PARALLEL_ALL_REQUIRED`, `PARALLEL_ANY_ONE`, `PARALLEL_QUORUM`.
   - **Quorum Requirement**: Enabled if `PARALLEL_QUORUM` is chosen.
   - **Assignment Rules**: Approver type (`ROLE`, `NAMED_USER`, `HOST_SPONSOR`, `RESPONSIBLE_MANAGER`), target role dropdown, and Segregation of Duties toggle (`allowSelfApproval = false`).
   - **SLA Parameters**: Target SLA minutes, warning threshold minutes, and manager auto-escalation toggle.
3. **Transition Configuration**:
   - Outbound triggers and dynamic condition builder (Field, Operator, Value, Logic).

### 3.3 Static Validation Integration
- The "Validate Workflow" action executes the `WorkflowValidator` and displays a detailed diagnostics modal showing errors (e.g., missing START stage, unreachable END stage, dead-end stages) or warnings.
- "Publish Version" is blocked if any diagnostics with severity `ERROR` are present.
