const NCAA_API =
    'https://ncaa-api.henrygd.me';

export async function getCollegeFootballWeek(
    fetch,
    year,
    week
) {
    const response = await fetch(
        `${NCAA_API}/scoreboard/football/fbs/${year}/${week}/all-conf`
    );

    if (!response.ok) {
        throw new Error(
            `Failed to load NCAA football Week ${week}`
        );
    }

    return await response.json();
}
