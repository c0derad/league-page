export async function load({ fetch, url }) {
    const response = await fetch('/cfb-model/index.json');
    if (!response.ok) {
        throw new Error('CFB model board manifest is unavailable.');
    }

    const manifest = await response.json();
    const weeks = (manifest.weeks || [])
        .slice()
        .sort((a, b) => a.season - b.season || a.week - b.week);

    const requestedWeek = Number(url.searchParams.get('week'));
    const requestedSeason = Number(url.searchParams.get('season'));

    const selected = weeks.find(
        (item) => item.week === requestedWeek &&
            (requestedSeason ? item.season === requestedSeason : true)
    ) || weeks[weeks.length - 1];

    if (!selected) {
        return { board: null, weeks, selectedWeek: null };
    }

    const boardResponse = await fetch('/cfb-model/' + selected.file);
    if (!boardResponse.ok) {
        throw new Error('CFB model board not found for the selected week.');
    }

    return {
        board: await boardResponse.json(),
        weeks,
        selectedWeek: selected.week
    };
}
