export async function load({ fetch, url }) {
    const response = await fetch('/cfb-model/index.json');
    if (!response.ok) {
        throw new Error('The CFB model year/week index is unavailable.');
    }

    const manifest = await response.json();
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
    const year = availableYears.find((item) => item.season === requestedSeason)
        || availableYears[availableYears.length - 1];

    const availableWeeks = (year.weeks || []).slice().sort((a, b) => a - b);
    const requestedWeek = Number(url.searchParams.get('week'));
    const selectedWeek = availableWeeks.includes(requestedWeek)
        ? requestedWeek
        : availableWeeks[availableWeeks.length - 1];

    const yearResponse = await fetch('/cfb-model/' + year.file);
    if (!yearResponse.ok) {
        throw new Error('CFB model archive unavailable for ' + year.season + '.');
    }

    const archive = await yearResponse.json();
    const games = (archive.games || []).filter((game) => game.week === selectedWeek);

    return {
        board: {
            season: year.season,
            week: selectedWeek,
            games,
            sourceFile: manifest.sourceFile || 'model_history_all.csv'
        },
        availableYears,
        availableWeeks,
        selectedSeason: year.season,
        selectedWeek,
        referenceLineNotice: manifest.referenceLineNotice || ''
    };
}
