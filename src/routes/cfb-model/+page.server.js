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

export function load({ url }) {
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
            referenceLineNotice: manifest.referenceLineNotice || ''
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
        referenceLineNotice: manifest.referenceLineNotice || ''
    };
}
