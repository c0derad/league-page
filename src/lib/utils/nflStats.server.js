const NFLVERSE_STATS_URL =
    'https://github.com/nflverse/nflverse-data/releases/download/stats_player/stats_player_week_2026.csv';

const PLAYER_IDS_URL =
    'https://raw.githubusercontent.com/dynastyprocess/data/master/files/db_playerids.csv';

function parseCSV(text) {
    const rows = [];
    let row = [];
    let field = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const next = text[i + 1];

        if (char === '"' && inQuotes && next === '"') {
            field += '"';
            i++;
            continue;
        }

        if (char === '"') {
            inQuotes = !inQuotes;
            continue;
        }

        if (char === ',' && !inQuotes) {
            row.push(field);
            field = '';
            continue;
        }

        if ((char === '\n' || char === '\r') && !inQuotes) {
            if (char === '\r' && next === '\n') {
                i++;
            }

            row.push(field);

            if (row.some((value) => value !== '')) {
                rows.push(row);
            }

            row = [];
            field = '';
            continue;
        }

        field += char;
    }

    if (field.length || row.length) {
        row.push(field);
        rows.push(row);
    }

    if (!rows.length) {
        return [];
    }

    const headers = rows[0].map(
        (header) => header.trim()
    );

    return rows.slice(1).map((values) => {
        const object = {};

        headers.forEach((header, index) => {
            object[header] =
                values[index] ?? '';
        });

        return object;
    });
}

function number(value) {
    if (
        value === null ||
        value === undefined ||
        value === '' ||
        value === 'NA'
    ) {
        return 0;
    }

    const result = Number(value);

    return Number.isFinite(result)
        ? result
        : 0;
}

export async function getWeeklyNFLStats(
    fetch,
    week
) {
    const [
        statsResponse,
        idsResponse
    ] = await Promise.all([
        fetch(NFLVERSE_STATS_URL),
        fetch(PLAYER_IDS_URL)
    ]);

    if (!statsResponse.ok) {
        throw new Error(
            `Unable to load nflverse stats: ${statsResponse.status}`
        );
    }

    if (!idsResponse.ok) {
        throw new Error(
            `Unable to load player ID crosswalk: ${idsResponse.status}`
        );
    }

    const [
        statsText,
        idsText
    ] = await Promise.all([
        statsResponse.text(),
        idsResponse.text()
    ]);

    const statsRows =
        parseCSV(statsText);

    const idRows =
        parseCSV(idsText);

    const sleeperByGsis =
        new Map();

    for (const row of idRows) {
        const sleeperID =
            row.sleeper_id ||
            row.sleeperId ||
            row.sleeper;

        const gsisID =
            row.gsis_id ||
            row.gsisId ||
            row.gsis;

        if (
            sleeperID &&
            gsisID
        ) {
            sleeperByGsis.set(
                String(gsisID),
                String(sleeperID)
            );
        }
    }

    const weeklyStats = {};

    for (const row of statsRows) {
        if (
            Number(row.week) !==
            Number(week)
        ) {
            continue;
        }

        const gsisID =
            row.player_id ||
            row.gsis_id;

        if (!gsisID) {
            continue;
        }

        const sleeperID =
            sleeperByGsis.get(
                String(gsisID)
            );

        if (!sleeperID) {
            continue;
        }

        weeklyStats[sleeperID] = {
            sleeperID,
            gsisID,

            name:
                row.player_display_name ||
                row.player_name ||
                '',

            position:
                row.position ||
                row.position_group ||
                '',

            team:
                row.team ||
                row.recent_team ||
                '',

            opponent:
                row.opponent_team ||
                '',

            passing: {
                completions:
                    number(
                        row.completions
                    ),

                attempts:
                    number(
                        row.attempts
                    ),

                yards:
                    number(
                        row.passing_yards
                    ),

                touchdowns:
                    number(
                        row.passing_tds
                    ),

                interceptions:
                    number(
                        row.passing_interceptions
                    ),

                sacks:
                    number(
                        row.sacks_suffered
                    )
            },

            rushing: {
                attempts:
                    number(
                        row.carries
                    ),

                yards:
                    number(
                        row.rushing_yards
                    ),

                touchdowns:
                    number(
                        row.rushing_tds
                    ),

                firstDowns:
                    number(
                        row.rushing_first_downs
                    )
            },

            receiving: {
                targets:
                    number(
                        row.targets
                    ),

                receptions:
                    number(
                        row.receptions
                    ),

                yards:
                    number(
                        row.receiving_yards
                    ),

                touchdowns:
                    number(
                        row.receiving_tds
                    ),

                airYards:
                    number(
                        row.receiving_air_yards
                    ),

                yardsAfterCatch:
                    number(
                        row.receiving_yards_after_catch
                    ),

                firstDowns:
                    number(
                        row.receiving_first_downs
                    )
            },

            fumbles: {
                lost:
                    number(
                        row.fumbles_lost_total
                    )
            }
        };
    }

    return weeklyStats;
}
