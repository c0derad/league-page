#!/usr/bin/env python3
"""Export model_history_all.csv or current_week_2026_wN.csv into season JSON archives.

No dependencies beyond Python 3. Source model predictions are not recalculated.
"""
import argparse
import csv
import json
import math
import re
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

SPREAD = re.compile(r"([+-]\d+(?:\.\d+)?)$")
SCORE = re.compile(r"^(.*?)\s+(\d+(?:\.\d+)?)\s+@\s+(.*?)\s+(\d+(?:\.\d+)?)$")
NOTICE = (
    "Model lines are reference spreads, not verified current sportsbook prices. "
    "BET/WATCH/PASS indicates a model screening rule, not an official published wager "
    "or a calibrated cover probability. Verify quarter-point reference lines."
)


def number(value):
    try:
        n = float(value)
        return n if math.isfinite(n) else None
    except (TypeError, ValueError):
        return None


def flag(value):
    return str(value or "").strip().lower() in ("true", "yes", "1")


def picked_team(value):
    return re.sub(r"\s+[+-]\d+(?:\.\d+)?\s*$", "", value or "").strip()


def picked_spread(value):
    m = SPREAD.search(value or "")
    return float(m.group(1)) if m else None


def timestamp(value):
    try:
        t = datetime.fromisoformat(str(value).strip().replace(" ", "T").replace("Z", "+00:00"))
        if t.tzinfo is None:
            raise ValueError("Missing timezone")
        return t.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")
    except (ValueError, TypeError):
        return None


def key(game):
    return (game["season"], game["week"], re.sub(r"[^a-z0-9]+", "", game["matchup"].lower()))


def convert(row):
    season, week = int(row["season"]), int(row["week"])
    matchup = row["matchup"].strip()
    teams = matchup.split(" @ ")
    if len(teams) != 2:
        raise ValueError(f"Unexpected matchup: {matchup}")
    score = SCORE.match(row.get("projected_score") or "")

    raw, cal, v3 = (row.get(c) or "").strip() for c in ("raw_pick", "cal_pick", "v3_pick")
    raw_agree = bool(raw and v3) and picked_team(raw) == picked_team(v3)
    cal_agree = bool(cal and v3) and picked_team(cal) == picked_team(v3)
    prod = flag(row.get("v3_production"))
    edge = number(row.get("v3_edge"))
    selected_line = picked_spread(v3)
    standard = selected_line is not None and abs(selected_line * 2 - round(selected_line * 2)) < 1e-8
    sweet = raw_agree and edge is not None and .75 <= edge < 1
    h3, s1 = flag(row.get("H3")), flag(row.get("S1"))

    if prod and standard and (raw_agree or cal_agree):
        status, tier = "BET", ("A" if sweet and cal_agree else "B")
    elif prod or sweet or h3 or s1 or (edge is not None and edge >= .5 and (raw_agree or cal_agree)):
        status, tier = "WATCH", "C"
    else:
        status, tier = "PASS", "D"

    reason = "V3 production qualifier" if prod else "Not V3 production"
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
    if not standard:
        reason += "; nonstandard reference spread—verify bookable line"

    game_id = str(row.get("game_id") or "").strip()
    if game_id.endswith(".0") and game_id[:-2].isdigit():
        game_id = game_id[:-2]
    if not game_id:
        game_id = re.sub(r"[^a-z0-9]+", "-", matchup.lower()).strip("-")
    v3_result = (row.get("v3_result") or "").strip()
    if v3_result not in ("WIN", "LOSS", "PUSH"):
        v3_result = None

    projected_away = number(row.get("projected_away_points"))
    projected_home = number(row.get("projected_home_points"))
    if projected_away is None and score:
        projected_away = float(score.group(2))
    if projected_home is None and score:
        projected_home = float(score.group(4))

    return dict(
        id=f"{season}-{week}-{game_id}", season=season, week=week,
        matchup=matchup, away=row.get("away_team") or teams[0],
        home=row.get("home_team") or teams[1],
        kickoffUtc=timestamp(row.get("start_date")),
        sourceType=row.get("source_type") or "CURRENT_LIVE",
        projectedAway=projected_away, projectedHome=projected_home,
        projectedTotal=number(row.get("projected_total")),
        v3Pick=v3, v3Edge=edge, v3Production=prod,
        rawPick=raw, rawEdge=number(row.get("raw_edge")),
        calPick=cal, calEdge=number(row.get("cal_edge")),
        rawAgree=raw_agree, calAgree=cal_agree,
        H3=h3, S1=s1, v6Qualified=flag(row.get("V6_QUALIFIED")),
        strategyTags=[x for x in (row.get("robust_strategy_tags") or "").split(";") if x],
        status=status, tier=tier, reason=reason, referenceLineOnly=not standard,
        actualAway=number(row.get("actual_away_points")),
        actualHome=number(row.get("actual_home_points")),
        v3Result=v3_result, closingHomeMargin=number(row.get("closing_home_margin"))
    )


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--input", type=Path, required=True)
    p.add_argument("--output-dir", type=Path, default=Path("static/cfb-model"))
    p.add_argument("--replace-history", action="store_true",
                   help="Replace the full archive instead of incrementally updating games")
    args = p.parse_args()
    with args.input.open(newline="", encoding="utf-8-sig") as f:
        incoming = [convert(row) for row in csv.DictReader(f)]
    if not incoming:
        raise SystemExit("CSV is empty")

    archive = defaultdict(dict)
    if not args.replace_history:
        index = args.output_dir / "index.json"
        if index.exists():
            manifest = json.loads(index.read_text(encoding="utf-8"))
            for year in manifest.get("years", []):
                year_file = args.output_dir / year["file"]
                if year_file.exists():
                    content = json.loads(year_file.read_text(encoding="utf-8"))
                    for game in content.get("games", []):
                        archive[int(year["season"])][key(game)] = game

    for game in incoming:
        k = key(game)
        previous = archive[game["season"]].get(k)
        # Never erase a known final score by replacing it with an ungraded live snapshot.
        if previous and previous.get("actualHome") is not None and game["actualHome"] is None:
            continue
        if previous:
            game["id"] = previous["id"]
        archive[game["season"]][k] = game

    args.output_dir.mkdir(parents=True, exist_ok=True)
    years = []
    for year in sorted(archive):
        games = sorted(archive[year].values(),
                       key=lambda x: (x["week"], x.get("kickoffUtc") or "", x["id"]))
        filename = f"{year}.json"
        (args.output_dir / filename).write_text(
            json.dumps(dict(schemaVersion=2, season=year, source="consolidated model history", games=games),
                       ensure_ascii=False, separators=(",", ":")) + "\n",
            encoding="utf-8"
        )
        weeks = sorted({g["week"] for g in games})
        years.append(dict(season=year, file=filename, weeks=weeks, gameCount=len(games)))
        print(f"{year}: {len(games)} games, available weeks: {weeks}")

    index = dict(schemaVersion=2, sourceFile=args.input.name,
                 referenceLineNotice=NOTICE, years=years)
    (args.output_dir / "index.json").write_text(
        json.dumps(index, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    print("Export complete. Commit the updated JSON archive files and manifest.")


if __name__ == "__main__":
    main()
