const NFLVERSE_STATS_URL =
    'https://github.com/nflverse/nflverse-data/releases/download/stats_player/stats_player_week_2026.csv';

const NFLVERSE_SCHEDULE_URL =
    'https://raw.githubusercontent.com/nflverse/nfldata/master/data/games.csv';

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

function normalizeTeam(team) {
    const map = {
        JAC: 'JAX',
        LA: 'LAR'
    };

    return map[team] || team;
}

function getTeamGame(
    scheduleRows,
    team,
    week
) {
    const normalizedTeam =
        normalizeTeam(team);

    const game =
        scheduleRows.find((row) => {
            const home =
                normalizeTeam(
                    row.home_team
                );

            const away =
                normalizeTeam(
                    row.away_team
                );

            return (
                Number(row.season) === 2026 &&
                Number(row.week) === Number(week) &&
                (
                    home === normalizedTeam ||
                    away === normalizedTeam
                )
            );
        });

    if (!game) {
        return null;
    }

    const home =
        normalizeTeam(
            game.home_team
        );

    const away =
        normalizeTeam(
            game.away_team
        );

    const isHome =
        home === normalizedTeam;

    const opponent =
        isHome
            ? away
            : home;

    const rawTeamScore =
        isHome
            ? game.home_score
            : game.away_score;

    const rawOpponentScore =
        isHome
            ? game.away_score
            : game.home_score;

    const completed =
        rawTeamScore !== '' &&
        rawOpponentScore !== '' &&
        rawTeamScore !== 'NA' &&
        rawOpponentScore !== 'NA';

    if (!completed) {
        return {
            opponent,
            location:
                isHome
                    ? 'vs'
                    : '@',
            completed: false,
            result: null,
            teamScore: null,
            opponentScore: null
        };
    }

    const teamScore =
        number(rawTeamScore);

    const opponentScore =
        number(rawOpponentScore);

    let result = 'T';

    if (teamScore > opponentScore) {
        result = 'W';
    }

    if (teamScore < opponentScore) {
        result = 'L';
    }

    return {
        opponent,

        location:
            isHome
                ? 'vs'
                : '@',

        completed: true,
        result,
        teamScore,
        opponentScore
    };
}

export async function getWeeklyNFLStats(
    fetch,
    week
) {
    const [
        statsResponse,
        idsResponse,
        scheduleResponse
    ] = await Promise.all([
        fetch(NFLVERSE_STATS_URL),
        fetch(PLAYER_IDS_URL),
        fetch(NFLVERSE_SCHEDULE_URL)
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

    if (!scheduleResponse.ok) {
        throw new Error(
            `Unable to load nflverse schedule: ${scheduleResponse.status}`
        );
    }

    const [
        statsText,
        idsText,
        scheduleText
    ] = await Promise.all([
        statsResponse.text(),
        idsResponse.text(),
        scheduleResponse.text()
    ]);

    const statsRows =
        parseCSV(statsText);

    const idRows =
        parseCSV(idsText);

    const scheduleRows =
        parseCSV(scheduleText);

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

        const team =
            normalizeTeam(
                row.team ||
                row.recent_team ||
                ''
            );

        const game =
            getTeamGame(
                scheduleRows,
                team,
                week
            );

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

            team,

            opponent:
                normalizeTeam(
                    row.opponent_team ||
                    game?.opponent ||
                    ''
                ),

            game,

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
