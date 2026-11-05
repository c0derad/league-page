import manifest from '../../../static/cfb-model-data/index.json';
import archive2022 from '../../../static/cfb-model-data/2022.json';
import archive2023 from '../../../static/cfb-model-data/2023.json';
import archive2024 from '../../../static/cfb-model-data/2024.json';
import archive2025 from '../../../static/cfb-model-data/2025.json';
import archive2026 from '../../../static/cfb-model-data/2026.json';

const archives = {
    2022: archive2022,
    2023: archive2023,
    2024: archive2024,
    2025: archive2025,
    2026: archive2026
};

const strategies = [
    {
        id: 'production',
        label: 'V3 production',
        note: 'Archived production-qualified V3 selections.',
        qualifies: (game) => game.v3Production === true
    },
    {
        id: 'bet',
        label: 'Dashboard BET tier',
        note: 'Current dashboard A/B screening rules, applied retrospectively.',
        qualifies: (game) => game.status === 'BET'
    },
    {
        id: 'bet_watch',
        label: 'BET + WATCH combined',
        note: 'All A/B BET and C WATCH signals counted once each; PASS excluded. Current dashboard tiers applied retrospectively.',
        qualifies: (game) => game.status === 'BET' || game.status === 'WATCH'
    },
    {
        id: 'sweet',
        label: 'V3/raw 0.75–1.00',
        note: 'V3 predicted CLV 0.75–1.00, with raw direction agreement.',
        qualifies: (game) => game.v3Edge >= 0.75 &&
            game.v3Edge < 1 && game.rawAgree === true
    },
    {
        id: 'all',
        label: 'All V3 model sides',
        note: 'Every game with a V3 pick, including non-production signals.',
        qualifies: (game) => Boolean(game.v3Pick)
    }
];

const signalValues = new Set(['ALL', 'BET', 'WATCH', 'BET_WATCH', 'PASS']);
const gradeValues = new Set(['A', 'B', 'C', 'D']);

const matchesSignal = (game, signal) =>
    signal === 'ALL' ||
    (signal === 'BET_WATCH'
        ? game.status === 'BET' || game.status === 'WATCH'
        : game.status === signal);

const matchesGrade = (game, grades) =>
    grades.length === 0 || grades.includes(game.tier);

const sumResults = (games) => {
    const result = {
        wins: 0,
        losses: 0,
        pushes: 0,
        ungraded: 0,
        total: games.length
    };

    for (const game of games) {
        if (game.v3Result === 'WIN') result.wins += 1;
        else if (game.v3Result === 'LOSS') result.losses += 1;
        else if (game.v3Result === 'PUSH') result.pushes += 1;
        else result.ungraded += 1;
    }

    result.graded = result.wins + result.losses + result.pushes;
    result.winPct = (result.wins + result.losses) > 0
        ? Math.round(1000 * result.wins / (result.wins + result.losses)) / 10
        : null;

    // Hypothetical flat 1-unit risk on every graded V3 pick at -110.
    // Each win earns 100/110 units, losses cost 1 unit, pushes return the stake.
    // Pushes still count as staked/returned capital in the ROI denominator.
    // Ungraded games never contribute to stakes or profit.
    result.stakeUnits = result.graded;
    result.netUnits = result.graded > 0
        ? result.wins * (100 / 110) - result.losses
        : null;
    result.roiPct = result.graded > 0
        ? (result.netUnits / result.stakeUnits) * 100
        : null;

    return result;
};

const allGames = Object.values(archives).flatMap((archive) => archive.games);

const performanceFor = (year, week, availableYears, availableWeeks, signal, grades) =>
    strategies.map((strategy) => {
        const selectedGames = allGames.filter((game) =>
            strategy.qualifies(game) &&
            matchesSignal(game, signal) &&
            matchesGrade(game, grades)
        );
        const inYear = selectedGames.filter((game) => game.season === year);

        return {
            id: strategy.id,
            label: strategy.label,
            note: strategy.note,
            lifetime: sumResults(selectedGames),
            currentSeason: sumResults(inYear),
            currentWeek: sumResults(inYear.filter((game) => game.week === week)),
            seasons: availableYears.map((item) => ({
                season: item.season,
                ...sumResults(selectedGames.filter(
                    (game) => game.season === item.season
                ))
            })),
            weeks: availableWeeks.map((availableWeek) => ({
                week: availableWeek,
                ...sumResults(inYear.filter(
                    (game) => game.week === availableWeek
                ))
            }))
        };
    });

export function load({ url }) {
    const requestedSignal = url.searchParams.get('signal') || 'ALL';
    const selectedSignal = signalValues.has(requestedSignal) ? requestedSignal : 'ALL';
    const selectedGrades = [...new Set(
        (url.searchParams.get('grades') || '')
            .split(',')
            .filter((grade) => gradeValues.has(grade))
    )].sort();

    const requestedStrategy = url.searchParams.get('strategy') || 'production';
    const selectedStrategy = strategies.some((strategy) => strategy.id === requestedStrategy)
        ? requestedStrategy
        : 'production';

    const availableYears = (manifest.years || [])
        .slice()
        .sort((a, b) => a.season - b.season);

    if (!availableYears.length) {
        return {
            board: null,
            availableYears: [],
            availableWeeks: [],
            selectedSeason: null,
            selectedWeek: null,
            referenceLineNotice: manifest.referenceLineNotice || '',
            performance: [],
            selectedSignal,
            selectedGrades,
            selectedStrategy
        };
    }

    const requestedSeason = Number(url.searchParams.get('season'));
    const selectedYear = availableYears.find(
        (item) => item.season === requestedSeason
    ) || availableYears[availableYears.length - 1];

    const availableWeeks = (selectedYear.weeks || [])
        .slice()
        .sort((a, b) => a - b);
    const requestedWeek = Number(url.searchParams.get('week'));
    const selectedWeek = availableWeeks.includes(requestedWeek)
        ? requestedWeek
        : availableWeeks[availableWeeks.length - 1];

    const archive = archives[selectedYear.season];
    if (!archive) {
        throw new Error('Missing CFB archive for season ' + selectedYear.season);
    }

    return {
        board: {
            season: selectedYear.season,
            week: selectedWeek,
            games: archive.games.filter((game) => game.week === selectedWeek),
            sourceFile: manifest.sourceFile || 'model_history_all.csv'
        },
        availableYears,
        availableWeeks,
        selectedSeason: selectedYear.season,
        selectedWeek,
        referenceLineNotice: manifest.referenceLineNotice || '',
        selectedSignal,
        selectedGrades,
        selectedStrategy,
        performance: performanceFor(
            selectedYear.season,
            selectedWeek,
            availableYears,
            availableWeeks,
            selectedSignal,
            selectedGrades
        )
    };
}
