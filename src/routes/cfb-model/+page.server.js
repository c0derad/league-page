import manifest from '../../../static/cfb-model-data/index.json';
import summary from '../../../static/cfb-model-data/summary.json';

// Load only the selected season. The previous implementation imported every
// ~600 KB archive and recomputed 3,214 game results on each filter change.
const archiveLoaders = {
    2022: () => import('../../../static/cfb-model-data/2022.json'),
    2023: () => import('../../../static/cfb-model-data/2023.json'),
    2024: () => import('../../../static/cfb-model-data/2024.json'),
    2025: () => import('../../../static/cfb-model-data/2025.json'),
    2026: () => import('../../../static/cfb-model-data/2026.json')
};

const validSignals = new Set(['ALL', 'BET', 'WATCH', 'BET_WATCH', 'PASS']);
const validGrades = new Set(['A', 'B', 'C', 'D']);
const validStrategies = new Set(['all', 'production', 'sweet']);

export async function load({ url }) {
    const years = manifest.years || [];
    if (!years.length) {
        return {
            board: null,
            availableYears: [],
            availableWeeks: [],
            summaryRows: [],
            selectedSignal: 'ALL',
            selectedGrades: [],
            selectedStrategy: 'all'
        };
    }

    const yearFromUrl = Number(url.searchParams.get('season'));
    const selectedYear = years.find((item) => item.season === yearFromUrl) ||
        years[years.length - 1];

    const weeks = selectedYear.weeks || [];
    const weekFromUrl = Number(url.searchParams.get('week'));
    const selectedWeek = weeks.includes(weekFromUrl)
        ? weekFromUrl
        : weeks[weeks.length - 1];

    const loadArchive = archiveLoaders[selectedYear.season];
    if (!loadArchive) {
        throw new Error('No archive for year ' + selectedYear.season);
    }

    const { default: archive } = await loadArchive();

    const requestedSignal = url.searchParams.get('signal') || 'ALL';
    const requestedStrategy = url.searchParams.get('strategy') || 'all';

    return {
        board: {
            season: selectedYear.season,
            week: selectedWeek,
            games: archive.games.filter((game) => game.week === selectedWeek),
            sourceFile: manifest.sourceFile || 'model_history_all.csv'
        },
        availableYears: years,
        availableWeeks: weeks,
        // Aggregated once during publishing. All strategies, seasons, and weeks
        // are represented in ~43 KB instead of sending the entire archive.
        summaryRows: summary.rows,
        selectedSignal: validSignals.has(requestedSignal) ? requestedSignal : 'ALL',
        selectedGrades: [...new Set(
            (url.searchParams.get('grades') || '')
                .split(',')
                .filter((grade) => validGrades.has(grade))
        )].sort(),
        selectedStrategy: validStrategies.has(requestedStrategy)
            ? requestedStrategy
            : 'all'
    };
}
