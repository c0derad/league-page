import {
    loadPlayers
} from '$lib/utils/helper';

import {
    leagueID
} from '$lib/utils/leagueInfo';

import rosterHistory from '$lib/data/rosterHistory.json';

const TEAM_NAMES = {
    1: 'Critical Chase Theory',
    2: 'PeterPanthers',
    3: 'The Oilers',
    4: 'Show Me Your TDs',
    5: 'Rhodes x Pags',
    6: '#FreeTony',
    7: 'Retardinals',
    8: 'Naberhood Sex Offender',
    9: 'Charles',
    10: 'ConsiderMeOiled',
    11: 'Campus Legends',
    12: 'Big frydown'
};

const round = (value) =>
    Math.round(
        Number(value || 0) * 100
    ) / 100;

export async function load({ fetch }) {
    const [
        rosterResponse,
        week1Response,
        week2Response,
        playersInfo
    ] = await Promise.all([
        fetch(
            `https://api.sleeper.app/v1/league/${leagueID}/rosters`
        ),

        fetch(
            `https://api.sleeper.app/v1/league/${leagueID}/matchups/1`
        ),

        fetch(
            `https://api.sleeper.app/v1/league/${leagueID}/matchups/2`
        ),

        loadPlayers(fetch)
    ]);

    if (!rosterResponse.ok) {
        throw new Error(
            `Failed to load rosters: ${rosterResponse.status}`
        );
    }

    if (!week1Response.ok) {
        throw new Error(
            `Failed to load Week 1 matchups: ${week1Response.status}`
        );
    }

    if (!week2Response.ok) {
        throw new Error(
            `Failed to load Week 2 matchups: ${week2Response.status}`
        );
    }

    const [
        currentRosters,
        week1Matchups,
        week2Matchups
    ] = await Promise.all([
        rosterResponse.json(),
        week1Response.json(),
        week2Response.json()
    ]);

    /*
     * Handles either shape:
     *
     * { players: {...} }
     *
     * or directly:
     *
     * {...players}
     */
    const players =
        playersInfo?.players ??
        playersInfo ??
        {};

    const getPlayer = (playerID) =>
        players?.[playerID] || null;

    const getPlayerName = (playerID) => {
        const player =
            getPlayer(playerID);

        if (!player) {
            return playerID;
        }

        return `${
            player.fn || ''
        } ${
            player.ln || ''
        }`.trim();
    };

    const getPlayerInfo = (
        playerID,
        week = 2
    ) => {
        const player =
            getPlayer(playerID);

        return {
            playerID,

            name:
                getPlayerName(playerID),

            position:
                player?.pos || null,

            nflTeam:
                player?.t || null,

            projection:
                round(
                    player?.wi?.[week]?.p ||
                    0
                )
        };
    };

    const getWeek1Matchup = (
        rosterID
    ) =>
        week1Matchups.find(
            (item) =>
                Number(item.roster_id) ===
                Number(rosterID)
        );

    const getWeek2Matchup = (
        rosterID
    ) =>
        week2Matchups.find(
            (item) =>
                Number(item.roster_id) ===
                Number(rosterID)
        );

    const getWeek2Opponent = (
        rosterID
    ) => {
        const ownMatchup =
            getWeek2Matchup(
                rosterID
            );

        if (!ownMatchup) {
            return null;
        }

        const opponent =
            week2Matchups.find(
                (item) =>
                    item.matchup_id ===
                        ownMatchup.matchup_id &&
                    Number(
                        item.roster_id
                    ) !==
                        Number(rosterID)
            );

        if (!opponent) {
            return null;
        }

        return {
            rosterID:
                opponent.roster_id,

            team:
                TEAM_NAMES[
                    opponent.roster_id
                ] ||
                `Roster ${opponent.roster_id}`
        };
    };

    const getWeek1BenchPoints = (
        matchup
    ) => {
        if (!matchup) {
            return 0;
        }

        const starters =
            new Set(
                matchup.starters || []
            );

        return round(
            (matchup.players || [])
                .filter(
                    (playerID) =>
                        !starters.has(
                            playerID
                        )
                )
                .reduce(
                    (
                        total,
                        playerID
                    ) =>
                        total +
                        Number(
                            matchup
                                .players_points?.[
                                    playerID
                                ] ||
                            0
                        ),
                    0
                )
        );
    };

    const getWeek1TopPerformers = (
        matchup
    ) => {
        if (!matchup) {
            return [];
        }

        return (
            matchup.starters || []
        )
            .map(
                (playerID) => ({
                    ...getPlayerInfo(
                        playerID,
                        1
                    ),

                    points:
                        round(
                            matchup
                                .players_points?.[
                                    playerID
                                ] ||
                            0
                        )
                })
            )
            .sort(
                (a, b) =>
                    b.points -
                    a.points
            )
            .slice(0, 5);
    };

    const getRosterChanges = (
        roster
    ) => {
        const previous =
            rosterHistory?.['1']
                ?.rosters?.[
                    roster.roster_id
                ];

        if (!previous) {
            return {
                added: [],
                dropped: []
            };
        }

        const previousPlayers =
            new Set(
                previous.players || []
            );

        const currentPlayers =
            new Set(
                roster.players || []
            );

        const added =
            [...currentPlayers]
                .filter(
                    (playerID) =>
                        !previousPlayers.has(
                            playerID
                        )
                )
                .map(
                    (playerID) =>
                        getPlayerInfo(
                            playerID,
                            2
                        )
                );

        const dropped =
            [...previousPlayers]
                .filter(
                    (playerID) =>
                        !currentPlayers.has(
                            playerID
                        )
                )
                .map(
                    (playerID) =>
                        getPlayerInfo(
                            playerID,
                            2
                        )
                );

        return {
            added,
            dropped
        };
    };

    const teams =
        currentRosters
            .map((roster) => {
                const rosterID =
                    Number(
                        roster.roster_id
                    );

                const week1Matchup =
                    getWeek1Matchup(
                        rosterID
                    );

                const starters =
                    roster.starters || [];

                const starterSet =
                    new Set(starters);

                const bench =
                    (roster.players || [])
                        .filter(
                            (playerID) =>
                                !starterSet.has(
                                    playerID
                                )
                        );

                const starterInfo =
                    starters.map(
                        (playerID) =>
                            getPlayerInfo(
                                playerID,
                                2
                            )
                    );

                const benchInfo =
                    bench.map(
                        (playerID) =>
                            getPlayerInfo(
                                playerID,
                                2
                            )
                    );

                const week2Projection =
                    round(
                        starterInfo.reduce(
                            (
                                total,
                                player
                            ) =>
                                total +
                                Number(
                                    player.projection ||
                                    0
                                ),
                            0
                        )
                    );

                const week2TopProjected =
                    [...starterInfo]
                        .sort(
                            (a, b) =>
                                b.projection -
                                a.projection
                        )
                        .slice(0, 5);

                return {
                    rosterID,

                    team:
                        TEAM_NAMES[
                            rosterID
                        ] ||
                        `Roster ${rosterID}`,

                    record: {
                        wins:
                            Number(
                                roster.settings
                                    ?.wins ||
                                0
                            ),

                        losses:
                            Number(
                                roster.settings
                                    ?.losses ||
                                0
                            ),

                        ties:
                            Number(
                                roster.settings
                                    ?.ties ||
                                0
                            )
                    },

                    seasonPoints:
                        round(
                            Number(
                                roster.settings
                                    ?.fpts ||
                                0
                            ) +
                            Number(
                                roster.settings
                                    ?.fpts_decimal ||
                                0
                            ) /
                                100
                        ),

                    potentialPoints:
                        round(
                            Number(
                                roster.settings
                                    ?.ppts ||
                                0
                            ) +
                            Number(
                                roster.settings
                                    ?.ppts_decimal ||
                                0
                            ) /
                                100
                        ),

                    waiverPosition:
                        roster.settings
                            ?.waiver_position ??
                        null,

                    waiverBudgetUsed:
                        roster.settings
                            ?.waiver_budget_used ??
                        0,

                    totalMoves:
                        roster.settings
                            ?.total_moves ??
                        0,

                    week1: {
                        score:
                            round(
                                week1Matchup
                                    ?.points ||
                                0
                            ),

                        benchPoints:
                            getWeek1BenchPoints(
                                week1Matchup
                            ),

                        topPerformers:
                            getWeek1TopPerformers(
                                week1Matchup
                            )
                    },

                    week2: {
                        opponent:
                            getWeek2Opponent(
                                rosterID
                            ),

                        projection:
                            week2Projection,

                        topProjected:
                            week2TopProjected
                    },

                    rosterChanges:
                        getRosterChanges(
                            roster
                        ),

                    currentRoster: {
                        starters:
                            starterInfo,

                        bench:
                            benchInfo,

                        reserve:
                            (
                                roster.reserve ||
                                []
                            ).map(
                                (playerID) =>
                                    getPlayerInfo(
                                        playerID,
                                        2
                                    )
                            )
                    }
                };
            })
            .sort(
                (a, b) =>
                    a.rosterID -
                    b.rosterID
            );

    return {
        powerRankingsData: {
            generatedAt:
                new Date()
                    .toISOString(),

            rankingWeek: 2,

            teamCount:
                teams.length,

            teams
        }
    };
}
