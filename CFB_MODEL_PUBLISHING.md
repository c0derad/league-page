# Czar's CFB Model Board

The model dashboard lives at `/cfb-model`. It is **separate from** `/best-bets`, which remains the official published Czar card and record.

## How to publish a new model week

1. In the `CFB_Model` project, run the existing live model and consolidated board scripts. Verify that the CSV contains the **actual pregame snapshot** you want publicly displayed.
2. From a clone of this `league-page` repository, run the exporter with Python 3 (no external Python dependencies):

   ```powershell
   python scripts/export_cfb_model_board.py --input "C:\Users\ConradBailey\Downloads\CFB_Model\outputs\consolidated_spread_model\current_week_2026_w11.csv" --snapshot-label "2026-11-12 14:00 CST"
   ```

3. Review `static/cfb-model/2026-w11.json` and `static/cfb-model/index.json`, then commit and push these two generated JSON files. Vercel deploys the updated board in the normal site deployment process.

The exporter **does not access the model API** or retrieve live lines; it packages the CSV you supply. It replaces the JSON for that week when rerun, so retain the original frozen predictions separately and distinguish refreshed snapshots from the original pregame release.

## Dashboard

- Game, away/home projected points, and model selected spread.
- Predicted V3 closing-line movement plus raw and calibrated model edges.
- S1, H3, V6 and production indicators; expanded rationale and strategy tags.
- BET/WATCH/PASS filter, search, kickoff sort, week selector and responsive layout.
- Kickoff shown in America/Chicago. Past kickoff is flagged as historical.

## Deterministic decision tiers (v1)

These **are not calibrated cover probabilities** and they do not automatically publish an official best bet.

- **A / BET:** Production V3; model reference spread is a whole/half-point; V3 edge is 0.75 to <1.00; raw and calibrated models both agree with V3.
- **B / BET:** Production V3; whole/half-point model reference spread; either raw or calibrated model agrees with V3.
- **C / WATCH:** Nonstandard quarter-point reference spread with production, V3/raw 0.75–1.00 agreement, H3, S1, or a V3 edge >=0.50 plus raw/cal agreement.
- **D / PASS:** Everything else.

**Important:** A quarter-point reference such as `+2.25` is *not* equivalent to a verified market price. Production-qualified quarter-point references are marked WATCH until someone verifies an actual bookable spread. Grades, official public records, model probabilities, and automatic bets are **not** implied by the dashboard classifications. Model tags are correlated and should not be counted as independent confirmations.

## Current initial snapshot

The included `2026-w10.json` is generated from the archived Week 10 CSV provided during development, which contained 62 games. It is a historical/model-data demonstration and is **not** represented as a real-time November 5 snapshot. To publish the latest V3 refresh, use the exporter with your newest CSV.

## Maintenance

Keep `static/cfb-model/index.json` in sync with new week JSON files (the exporter does this automatically). Retain `schemaVersion: 1` until updating the page loader and exporter together.

No API keys or proprietary model implementation files should be committed to this public repository.
