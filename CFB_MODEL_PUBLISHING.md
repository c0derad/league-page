# The Czar's CFB Model — Season Archive

The dashboard lives at `/cfb-model` and is separate from the existing official published `/best-bets` card.

## Data source

The initial database is the supplied `model_history_all.csv`:

- **3,214 games, seasons 2022–2026**
- All available weeks are included in the **Year** and **Week** slicers
- The 2026 source has Weeks 1–4 and 6–10; there is no 2026 Week 5 in this export
- Historical weeks show pregame projections, recorded V3 selections and results, and final scores when supplied
- The source has **some postseason-dated games under historical Week 1**; the site preserves the file's labels rather than silently changing them
- In 2026 Week 10, five games have final scores and the others are still ungraded in this snapshot

Each year is a static JSON file in `static/cfb-model-data/YYYY.json`. The `index.json` manifest controls which years/weeks appear. A visitor loads only one year's archive and the selected week's games.

## Export or refresh from VS Code

Clone or pull the latest `league-page` repository, then run these commands from its root directory. Python 3 is the only requirement.

**Rebuild all history using a full model history CSV:**

```powershell
python scripts/export_cfb_model_board.py --input "C:\Users\ConradBailey\Downloads\CFB_Model\outputs\week10_review\consolidated\model_history_all.csv" --replace-history
```

Use the actual full-history CSV path on your computer; that example path may differ from yours. This writes all year JSON files and the year/week index.

**Incrementally publish a new weekly board without deleting older seasons:**

```powershell
python scripts/export_cfb_model_board.py --input "C:\Users\ConradBailey\Downloads\CFB_Model\outputs\consolidated_spread_model\current_week_2026_w11.csv"
```

The exporter merges weekly games by year/week/matchup; missing `game_id` columns are supported. It retains an existing graded game's final score rather than erasing it with an ungraded refresh.

Review the generated JSON files and `static/cfb-model-data/index.json`; commit and push the changes to your GitHub repository. Vercel then follows your normal deployment workflow. There is no automatic live refresh or live odds integration yet.

## Dashboard functionality

- Separate **Year** and **Week** selectors.
- Model projected score and, when provided, actual final score and V3 ATS result.
- V3 selected spread and predicted CLV, raw and calibrated edges, H3/S1/V6 signals.
- BET/WATCH/PASS model screening tiers, sortable/searchable responsive game board.
- Pre-kickoff vs. past-kickoff status, Central Time display.

## Performance summaries

The Model Performance section shows **Week**, **selected Season**, and **Lifetime** W–L–P cards, plus week-by-week and year-by-year records. A strategy selector updates all three scopes together:

- **V3 production (default)**: v3_production is true.
- **Dashboard BET tier**: the site's current A/B rule, applied retrospectively; not your actual published picks.
- **BET + WATCH combined**: union of status = BET and status = WATCH (A/B/C tiers), counting each distinct game exactly once and excluding PASS. This is available both in the performance strategy selector and as a game-board filter.
- **V3/raw 0.75–1.00**: V3 edge 0.75 to <1.00 with raw pick agreement.
- **All V3 model sides**: every game with a V3 pick.

For every scope, only `v3_result` values WIN, LOSS and PUSH are graded. Other entries are ungraded and **excluded** from W–L–P and ROI. Win rate = wins / (wins + losses), ignoring pushes.

**Hypothetical ROI and net units** are calculated in the server-side results aggregator and displayed on the three record cards, in weekly/season breakdown tables, and in the lifetime footer. The fixed default assumption is **American odds -110, 1 unit risked on every graded model pick**:

- Win: `+100/110 = +0.9090909 units`.
- Loss: `-1 unit`.
- Push: `0 units` (stake refunded); still counts as 1 unit risked in the ROI denominator.
- Net units: `wins * (100 / 110) - losses`.
- Total staked units: `wins + losses + pushes`.
- ROI: `100 * net_units / total_staked_units` (display `—` when no games have been graded).

**This is an illustrative flat-stake backtest at assumed odds.** It is not actual sportsbook pricing, verified executable betting history, realized closing-line value, or the Czar's personally published/purchased betting record. Individual odds, bookability, and limits are not in the consolidated archive.

The lifetime denominator covers all available seasons **2022–2026**, but the data is not uniform: 2022 starts at Week 9; 2023–2025 use reconstructed historical grades, whereas 2026 has graded games mixed with current live predictions. The dashboard shows these limitations and **does not equate model results with actual placed wagers**.

## Rating rules (v1, not win probabilities)

- **Tier A / BET**: V3 production, whole/half-point reference spread, V3/raw agreement in the 0.75–1.00 band, and calibrated agreement.
- **Tier B / BET**: V3 production, whole/half-point reference spread and agreement from raw or calibrated.
- **Tier C / WATCH**: other production qualifiers or partial alignment; includes nonstandard quarter-point reference spreads requiring line verification.
- **Tier D / PASS**: no listed qualification.

A `BET` label is a *model-screening signal*, not an official published selection or an actual wager. The source's V3 ATS results are model-side grades, not returns on your personal card. Historical simulations can involve post hoc reconstructions, and these confidence tiers are not calibrated probabilities.

No model implementation files, API secrets, private credentials, or book account information are included in the public site.
