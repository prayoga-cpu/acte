# AI matching and confidence — stage 5

Brief v2 §5: the scoring algorithm is undefined; the prototype shows mock values. Build evaluation before the matcher.

## Order of work
1. **Eval set first.** 200+ synthetic labelled examples: activity signals → correct dossier. Includes hard cases (two dossiers for the same client, new client with no dossier, "Non facturable").
2. **Rules baseline.** Deterministic signals, weighted: dossier token match in document name; correspondent domain or address known on a dossier; recency of activity on a dossier; template origin. Score = calibrated combination, 0–100.
3. **Measure.** Accuracy and calibration per band (≥90, 80–89, <80).
4. **Only then** consider a learned model, running per D-002.

## Targets
- ≥ 85% correct assignment on the eval set.
- The ≥ 90 band correct at least 90% of the time. If calibration fails, lower the displayed score; never display confidence we have not earned.

## Corrections
Stage 5 logs corrections and uses them as a per-firm signal (a reassigned token now points to the new dossier). "The AI learns" in the UI must match what the system actually does.

## Where it runs
Per D-002. Default assumption: on the device, because the signals are sensitive.
