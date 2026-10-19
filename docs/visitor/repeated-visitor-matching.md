# Returning Visitor Disambiguation & Profile Resolution

## 1. Overview

In industrial manufacturing operations, frequent visitors (contract auditors, logistics brokers, equipment field service engineers, and regular suppliers) return dozens of times per year. Creating duplicate master profiles causes fragmented audit trails, inaccurate historical reporting, and unnecessary administrative burden.

The **Returning Visitor Resolution Engine** deterministically identifies repeat visitors while avoiding accidental cross-profile contamination when individuals share names or corporate domains.

---

## 2. Disambiguation Flow Diagram

```mermaid
flowchart TD
    Input[Search Query: Phone, Email, or Full Name] --> Sanitize[Sanitize Digits: E.164 Clean & Lowercase Email]
    Sanitize --> QueryDB[(Query visitor_profiles in Tenant)]
    
    QueryDB --> ExactPhone{Exact Phone Match?}
    ExactPhone -- Yes --> 100Pct[Score: 100% - Definite Match]
    
    ExactPhone -- No --> ExactEmail{Exact Email Match?}
    ExactEmail -- Yes --> 95Pct[Score: 95% - High Confidence Match]
    
    ExactEmail -- No --> FuzzyName[Fuzzy Match on Name + Company]
    FuzzyName --> ScoreEval{Confidence Score >= 80%?}
    
    ScoreEval -- Yes --> CandidateList[Present Candidate List to Operator]
    ScoreEval -- No --> NewProfilePrompt[No High Confidence Match -> Create New Profile]
    
    100Pct --> DisambiguateDialog[Operator Confirms Returning Visitor Profile]
    95Pct --> DisambiguateDialog
    CandidateList --> DisambiguateDialog
    
    DisambiguateDialog --> LinkTxn[Link New Visit Transaction to Existing Profile ID]
    LinkTxn --> AuditRecord[Log Traceable Matching Event to Audit Trail]
```

---

## 3. Disambiguation Scoring Model

Candidate matches are scored dynamically using a 4-tier weighting algorithm:

| Match Criterion | Match Type | Weight / Score | Resolution Behavior |
|:---|:---|:---|:---|
| **Cleaned Phone Number** | Exact match on 10-digit suffix | **100%** | Auto-select profile; prompt operator to confirm. |
| **Email Address** | Exact case-insensitive match | **95%** | Auto-populate profile; prompt operator to confirm. |
| **Name + Company** | Levenshtein distance <= 2 | **80%** | Display candidate card with masked phone/email. |
| **Name Only** | Phonetic / partial string match | **40%** | Display ambiguous warning; require phone verification. |

---

## 4. Privacy & Masking Safeguards

When presenting candidates to security desk operators:
- **Phone Number Masking**: Formatted as `+91-XXXXX-11223` to preserve privacy against shoulder surfing.
- **Govt Identification Numbers**: Strictly redacted (e.g. `AADHAAR: **** **** 4892`, `PAN: *****124A`).
- **Blacklist & Alert Tags**: If an existing profile carries an active security watchlist flag or site barring notice, the system immediately highlights a critical restriction banner and alerts the Security Control Room.
