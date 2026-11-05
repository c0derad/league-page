#!/usr/bin/env python3
"""Publish one frozen CFB model CSV to the fantasy site's static JSON board.

No third-party Python packages are required.
Run this from the league-page repository (see CFB_MODEL_PUBLISHING.md).
Do not publish API tokens or private model inputs.
"""
import argparse
import csv
import json
import math
import re
from datetime import datetime, timezone
from pathlib import Path


SCORE_RE = re.compile(r"^(.*?)\s+(\d+(?:\.\d+)?)\s+@\s+(.*?)\s+(\d+(?:\.\d+)?)$")
SPREAD_RE = re.compile(r"([+-]\d+(?:\.\d+)?)$")
REFERENCE_NOTICE = (
    "Spreads are model reference lines, NOT verified currently available sportsbook odds. "
    "BET indicates a model filter, not a placed wager. "
    "Quarter-point lines are WATCH pending price verification."
)


def number(value):
    try:
        n = float(value)
        return n if math.isfinite(n) else None
    except (TypeError, ValueError):
        return None


def yes(value):
    return str(value).strip().lower() in {"1", "true", "yes"}


def pick_team(pick):
    return re.sub(r"\s+[+-]\d+(?:\.\d+)?\s*$", "", pick or "").strip()


def pick_spread(pick):
    match = SPREAD_RE.search(pick or "")
    return float(match.group(1)) if match else None


def kickoff_utc(value):
    if not value:
        return None
    try:
        timestamp = datetime.fromisoformat(value.strip().replace(" ", "T"))
        if timestamp.tzinfo is None:
            raise ValueError("Kickoff is missing a timezone")
        return timestamp.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")
    except ValueError:
        return None


def game_from_row(row):
    matchup = row.get("matchup", "").strip()
    parts = matchup.split(" @ ")
    if len(parts) != 2:
        raise ValueError(f"Cannot parse matchup: {matchup!r}")

    raw = row.get("raw_pick", "")
    cal = row.get("cal_pick", "")
    v3 = row.get("v3_pick", "")
    raw_agree = pick_team(raw) == pick_team(v3) and bool(v3)
    cal_agree = pick_team(cal) == pick_team(v3) and bool(v3)
    edge = number(row.get("v3_edge"))
    spread = pick_spread(v3)
    standard_line = spread is not None and abs(spread * 2 - round(spread * 2)) < 1e-8
    production = yes(row.get("v3_production"))
    sweet = edge is not None and .75 <= edge < 1 and raw_agree

    if production and standard_line and (raw_agree or cal_agree):
        status = "BET"
        tier = "A" if sweet and raw_agree and cal_agree else "B"
    elif production or sweet or (
        edge is not None and edge >= .5 and (raw_agree or cal_agree)
    ) or yes(row.get("H3")) or yes(row.get("S1")):
        status, tier = "WATCH", "C"
    else:
        status, tier = "PASS", "D"

    reason = "V3 production qualifier" if production else "Not a V3 production qualifier"
    if sweet:
        reason += "; V3/raw 0.75–1.00 filter"
    if raw_agree and cal_agree:
        reason += "; raw and calibrated agree"
    elif raw_agree:
        reason += "; raw agrees"
    elif cal_agree:
        reason += "; calibrated agrees"
    else:
        reason += "; fundamentals oppose"
    if not standard_line:
        reason += "; quarter-point reference line — verify an available price"

    projected_score = SCORE_RE.match(row.get("projected_score", "").strip())
    slug = re.sub(r"[^a-z0-9]+", "-", matchup.lower()).strip("-")

    return {
        "id": f"{row['season']}-w{row['week']}-{slug}",
        "matchup": matchup,
        "away": parts[0],
        "home": parts[1],
        "kickoffUtc": kickoff_utc(row.get("start_date")),
        "projectedAway": float(projected_score.group(2)) if projected_score else None,
        "projectedHome": float(projected_score.group(4)) if projected_score else None,
        "projectedTotal": number(row.get("projected_total")),
        "v3Pick": v3,
        "v3Edge": edge,
        "v3Production": production,
        "rawPick": raw,
        "rawEdge": number(row.get("raw_edge")),
        "calPick": cal,
        "calEdge": number(row.get("cal_edge")),
        "rawAgree": raw_agree,
        "calAgree": cal_agree,
        "H3": yes(row.get("H3")),
        "S1": yes(row.get("S1")),
        "v6Qualified": yes(row.get("V6_QUALIFIED")),
        "strategyTags": [
            item for item in row.get("robust_strategy_tags", "").split(";") if item
        ],
        "status": status,
        "tier": tier,
        "reason": reason,
        "referenceLineOnly": not standard_line
    }


def main():
    parser = argparse.ArgumentParser(description="Export consolidated CFB model CSV for league-page.")
    parser.add_argument("--input", required=True, type=Path, help="current_week_2026_wN.csv")
    parser.add_argument("--output-dir", type=Path, default=Path("static/cfb-model"))
    parser.add_argument(
        "--snapshot-label",
        default="Model snapshot time not provided. Verify current prices before betting.",
        help="Human-readable date/time when original model predictions were frozen"
    )
    args = parser.parse_args()

    with args.input.open(encoding="utf-8-sig", newline="") as handle:
        rows = list(csv.DictReader(handle))
    if not rows:
        raise SystemExit("Input CSV is empty.")

    season, week = int(rows[0]["season"]), int(rows[0]["week"])
    for row in rows:
        if int(row["season"]) != season or int(row["week"]) != week:
            raise SystemExit("Input contains multiple seasons or weeks; refusing to publish.")

    games = [game_from_row(row) for row in rows]
    if len({game["id"] for game in games}) != len(games):
        raise SystemExit("Duplicate matchup identifiers; inspect input before publishing.")

    args.output_dir.mkdir(parents=True, exist_ok=True)
    filename = f"{season}-w{week}.json"
    payload = {
        "schemaVersion": 1,
        "season": season,
        "week": week,
        "sourceFile": args.input.name,
        "snapshotLabel": args.snapshot_label,
        "referenceLineNotice": REFERENCE_NOTICE,
        "games": games
    }

    (args.output_dir / filename).write_text(
        json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )

    index_path = args.output_dir / "index.json"
    if index_path.exists():
        manifest = json.loads(index_path.read_text(encoding="utf-8"))
    else:
        manifest = {"schemaVersion": 1, "weeks": []}

    entries = [
        item for item in manifest.get("weeks", [])
        if not (int(item["season"]) == season and int(item["week"]) == week)
    ]
    entries.append({"season": season, "week": week, "file": filename})
    manifest["weeks"] = sorted(entries, key=lambda item: (item["season"], item["week"]))
    index_path.write_text(
        json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )

    counts = {name: sum(game["status"] == name for game in games) for name in ("BET", "WATCH", "PASS")}
    print(f"Published {len(games)} games for {season} Week {week}: {counts}")
    print(f"Snapshot: {args.snapshot_label}")
    print(f"Files: {args.output_dir / filename}; {index_path}")
    print("Commit the JSON files and push to publish via Vercel.")


if __name__ == "__main__":
    main()
