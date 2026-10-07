<!-- Week 5 power rankings data -->
<script>
    export let data;

    const TEAM_NAMES = {
        1: 'The Car Bombs',
        2: 'PeterPanthers',
        3: 'The Oilers',
        4: 'Show Me Your TDs',
        5: 'Rhodes x Pags',
        6: '#FreeTony',
        7: 'Retardinals',
        8: 'Naberhood Sex Offender',
        9: 'Charles',
        10: 'Moore Oil Coming',
        11: 'Campus Legends',
        12: 'Big frydown'
    };

    const round = (value) =>
        Math.round(
            Number(value || 0) * 100
        ) / 100;

    const getPlayerName = (
        playerID
    ) => {
        const player =
            data.players?.[
                playerID
            ];

        if (!player) {
            return String(
                playerID
            );
        }

        const first =
            player.fn || '';

        const last =
            player.ln || '';

        return (
            `${first} ${last}`.trim() ||
            String(playerID)
        );
    };

    const getTeamName = (
        rosterID
    ) => {
        const manager =
            data.teamManagers
                ?.find?.(
                    (team) =>
                        Number(
                            team.roster_id
                        ) ===
                        Number(
                            rosterID
                        )
                );

        return (
            manager
                ?.metadata
                ?.team_name ||
            manager?.team_name ||
            TEAM_NAMES[
                Number(
                    rosterID
                )
            ] ||
            manager?.name ||
            manager
                ?.display_name ||
            `Roster ${rosterID}`
        );
    };

    const getMatchupsForWeek = (
        week
    ) => {
        return (
            data[
                `week${week}Matchups`
            ] ||
            []
        );
    };

    const getMatchup = (
        week,
        rosterID
    ) => {
        return (
            getMatchupsForWeek(
                week
            )
                .find(
                    (item) =>
                        Number(
                            item.roster_id
                        ) ===
                        Number(
                            rosterID
                        )
                )
        );
    };

    const getOpponent = (
        week,
        rosterID
    ) => {
        const team =
            getMatchup(
                week,
                rosterID
            );

        if (!team) {
            return null;
        }

        const opponent =
            getMatchupsForWeek(
                week
            )
                .find(
                    (item) =>
                        item.matchup_id ===
                            team.matchup_id &&
                        Number(
                            item.roster_id
                        ) !==
                            Number(
                                rosterID
                            )
                );

        if (!opponent) {
            return null;
        }

        return {
            rosterID:
                Number(
                    opponent
                        .roster_id
                ),

            name:
                getTeamName(
                    opponent
                        .roster_id
                )
        };
    };

    const getProjectedPoints = (
        roster,
        week
    ) => {
        return round(
            (
                roster.starters ||
                []
            )
                .reduce(
                    (
                        total,
                        playerID
                    ) => {
                        const projection =
                            data.players?.[
                                playerID
                            ]?.wi?.[
                                week
                            ]?.p ||
                            0;

                        return (
                            total +
                            Number(
                                projection
                            )
                        );
                    },
                    0
                )
        );
    };

    const getTopProjectedStarters =
        (
            roster,
            week
        ) => {
            return (
                roster.starters ||
                []
            )
                .map(
                    (
                        playerID
                    ) => {
                        const player =
                            data.players?.[
                                playerID
                            ];

                        return {
                            playerID,

                            name:
                                getPlayerName(
                                    playerID
                                ),

                            position:
                                player
                                    ?.pos ||
                                null,

                            nflTeam:
                                player
                                    ?.t ||
                                null,

                            projection:
                                round(
                                    player
                                        ?.wi?.[
                                            week
                                        ]?.p ||
                                    0
                                )
                        };
                    }
                )
                .sort(
                    (
                        a,
                        b
                    ) =>
                        b.projection -
                        a.projection
                )
                .slice(
                    0,
                    5
                );
        };

    const getTopPerformers = (
        week,
        rosterID
    ) => {
        const matchup =
            getMatchup(
                week,
                rosterID
            );

        if (!matchup) {
            return [];
        }

        return (
            matchup.starters ||
            []
        )
            .map(
                (
                    playerID
                ) => ({
                    playerID,

                    name:
                        getPlayerName(
                            playerID
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
                (
                    a,
                    b
                ) =>
                    b.points -
                    a.points
            )
            .slice(
                0,
                5
            );
    };

    const getBenchPoints = (
        week,
        rosterID
    ) => {
        const matchup =
            getMatchup(
                week,
                rosterID
            );

        if (!matchup) {
            return 0;
        }

        const starters =
            new Set(
                matchup.starters ||
                []
            );

        return round(
            (
                matchup.players ||
                []
            )
                .filter(
                    (
                        playerID
                    ) =>
                        !starters
                            .has(
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

    const getRosterChanges = (
        roster
    ) => {
        const previous =
            data.week4Snapshot
                ?.rosters?.[
                    roster.roster_id
                ];

        if (!previous) {
            return {
                added: [],
                dropped: []
            };
        }

        const oldPlayers =
            new Set(
                previous.players ||
                []
            );

        const currentPlayers =
            new Set(
                roster.players ||
                []
            );

        const added =
            [
                ...currentPlayers
            ]
                .filter(
                    (id) =>
                        !oldPlayers
                            .has(
                                id
                            )
                )
                .map(
                    (id) => ({
                        playerID:
                            id,

                        name:
                            getPlayerName(
                                id
                            )
                    })
                );

        const dropped =
            [
                ...oldPlayers
            ]
                .filter(
                    (id) =>
                        !currentPlayers
                            .has(
                                id
                            )
                )
                .map(
                    (id) => ({
                        playerID:
                            id,

                        name:
                            getPlayerName(
                                id
                            )
                    })
                );

        return {
            added,
            dropped
        };
    };

    const getRecordThroughWeek4 = (
        rosterID
    ) => {
        let wins = 0;
        let losses = 0;
        let ties = 0;

        for (
            const week
            of [
                1,
                2,
                3,
                4
            ]
        ) {
            const weekMatchups =
                getMatchupsForWeek(
                    week
                );

            const team =
                weekMatchups
                    .find(
                        (item) =>
                            Number(
                                item
                                    .roster_id
                            ) ===
                            Number(
                                rosterID
                            )
                    );

            if (!team) {
                continue;
            }

            const opponent =
                weekMatchups
                    .find(
                        (item) =>
                            item
                                .matchup_id ===
                                team
                                    .matchup_id &&
                            Number(
                                item
                                    .roster_id
                            ) !==
                                Number(
                                    rosterID
                                )
                    );

            if (!opponent) {
                continue;
            }

            const teamPoints =
                Number(
                    team.points ||
                    0
                );

            const opponentPoints =
                Number(
                    opponent.points ||
                    0
                );

            if (
                teamPoints >
                opponentPoints
            ) {
                wins++;
            } else if (
                teamPoints <
                opponentPoints
            ) {
                losses++;
            } else {
                ties++;
            }
        }

        if (
            ties >
            0
        ) {
            return (
                `${wins}-${losses}-${ties}`
            );
        }

        return (
            `${wins}-${losses}`
        );
    };

    const normalizePlayerMap = (
        playerMap
    ) => {
        return (
            Object.entries(
                playerMap ||
                {}
            )
                .map(
                    ([
                        playerID,
                        rosterID
                    ]) => ({
                        playerID,

                        name:
                            getPlayerName(
                                playerID
                            ),

                        rosterID:
                            Number(
                                rosterID
                            ),

                        team:
                            getTeamName(
                                rosterID
                            )
                    })
                )
        );
    };

    const getTradePlayerMoves = (
        transaction
    ) => {
        const adds =
            transaction.adds ||
            {};

        const drops =
            transaction.drops ||
            {};

        const playerIDs =
            [
                ...new Set([
                    ...Object.keys(
                        adds
                    ),

                    ...Object.keys(
                        drops
                    )
                ])
            ];

        return playerIDs
            .map(
                (
                    playerID
                ) => {
                    const fromRosterID =
                        drops[
                            playerID
                        ] != null
                            ? Number(
                                drops[
                                    playerID
                                ]
                            )
                            : null;

                    const toRosterID =
                        adds[
                            playerID
                        ] != null
                            ? Number(
                                adds[
                                    playerID
                                ]
                            )
                            : null;

                    return {
                        playerID,

                        name:
                            getPlayerName(
                                playerID
                            ),

                        fromRosterID,

                        fromTeam:
                            fromRosterID
                                ? getTeamName(
                                    fromRosterID
                                )
                                : null,

                        toRosterID,

                        toTeam:
                            toRosterID
                                ? getTeamName(
                                    toRosterID
                                )
                                : null
                    };
                }
            )
            .filter(
                (
                    move
                ) =>
                    move
                        .fromRosterID ||
                    move
                        .toRosterID
            );
    };

    const normalizeWaiverBudget = (
        waiverBudget
    ) => {
        return (
            waiverBudget ||
            []
        )
            .map(
                (item) => ({
                    senderRosterID:
                        Number(
                            item.sender
                        ),

                    senderTeam:
                        getTeamName(
                            item.sender
                        ),

                    receiverRosterID:
                        Number(
                            item.receiver
                        ),

                    receiverTeam:
                        getTeamName(
                            item.receiver
                        ),

                    amount:
                        Number(
                            item.amount ||
                            0
                        )
                })
            );
    };

    const normalizeDraftPicks = (
        draftPicks
    ) => {
        return (
            draftPicks ||
            []
        )
            .map(
                (pick) => ({
                    season:
                        pick.season,

                    round:
                        pick.round,

                    originalRosterID:
                        pick
                            .roster_id,

                    originalTeam:
                        pick
                            .roster_id
                            ? getTeamName(
                                pick
                                    .roster_id
                            )
                            : null,

                    previousOwnerID:
                        pick
                            .previous_owner_id,

                    previousOwner:
                        pick
                            .previous_owner_id
                            ? getTeamName(
                                pick
                                    .previous_owner_id
                            )
                            : null,

                    newOwnerID:
                        pick
                            .owner_id,

                    newOwner:
                        pick
                            .owner_id
                            ? getTeamName(
                                pick
                                    .owner_id
                            )
                            : null
                })
            );
    };

    const normalizeTransaction = (
        transaction
    ) => {
        const rosterIDs =
            (
                transaction
                    .roster_ids ||
                []
            )
                .map(
                    (id) =>
                        Number(
                            id
                        )
                );

        const isTrade =
            transaction.type ===
            'trade';

        return {
            transactionID:
                transaction
                    .transaction_id,

            type:
                transaction.type,

            status:
                transaction.status,

            week:
                transaction.leg,

            created:
                transaction.created
                    ? new Date(
                        Number(
                            transaction
                                .created
                        )
                    ).toISOString()
                    : null,

            statusUpdated:
                transaction
                    .status_updated
                    ? new Date(
                        Number(
                            transaction
                                .status_updated
                        )
                    ).toISOString()
                    : null,

            rosterIDs,

            teams:
                rosterIDs.map(
                    (
                        rosterID
                    ) => ({
                        rosterID,

                        team:
                            getTeamName(
                                rosterID
                            )
                    })
                ),

            waiverBid:
                transaction
                    .settings
                    ?.waiver_bid ??
                null,

            adds:
                normalizePlayerMap(
                    transaction.adds
                ),

            drops:
                normalizePlayerMap(
                    transaction.drops
                ),

            playerMoves:
                isTrade
                    ? getTradePlayerMoves(
                        transaction
                    )
                    : [],

            waiverBudget:
                normalizeWaiverBudget(
                    transaction
                        .waiver_budget
                ),

            draftPicks:
                normalizeDraftPicks(
                    transaction
                        .draft_picks
                ),

            metadata:
                transaction.metadata ||
                null
        };
    };

    const completedWeek5Transactions =
        (
            data
                .week5Transactions ||
            []
        )
            .filter(
                (
                    transaction
                ) =>
                    transaction
                        .status ===
                    'complete'
            )
            .map(
                normalizeTransaction
            )
            .sort(
                (
                    a,
                    b
                ) => {
                    const aTime =
                        a.created
                            ? new Date(
                                a.created
                            ).getTime()
                            : 0;

                    const bTime =
                        b.created
                            ? new Date(
                                b.created
                            ).getTime()
                            : 0;

                    return (
                        aTime -
                        bTime
                    );
                }
            );

    const powerData =
        (
            data
                .currentRosters ||
            []
        )
            .map(
                (
                    roster
                ) => {
                    const rosterID =
                        Number(
                            roster
                                .roster_id
                        );

                    const week1 =
                        getMatchup(
                            1,
                            rosterID
                        );

                    const week2 =
                        getMatchup(
                            2,
                            rosterID
                        );

                    const week3 =
                        getMatchup(
                            3,
                            rosterID
                        );

                    const week4 =
                        getMatchup(
                            4,
                            rosterID
                        );

                    const week5 =
                        getMatchup(
                            5,
                            rosterID
                        );

                    const opponent =
                        getOpponent(
                            5,
                            rosterID
                        );

                    return {
                        rosterID,

                        team:
                            getTeamName(
                                rosterID
                            ),

                        record:
                            getRecordThroughWeek4(
                                rosterID
                            ),

                        week1Score:
                            round(
                                week1
                                    ?.points ||
                                0
                            ),

                        week2Score:
                            round(
                                week2
                                    ?.points ||
                                0
                            ),

                        week3Score:
                            round(
                                week3
                                    ?.points ||
                                0
                            ),

                        week4Score:
                            round(
                                week4
                                    ?.points ||
                                0
                            ),

                        week4BenchPoints:
                            getBenchPoints(
                                4,
                                rosterID
                            ),

                        week5MatchupID:
                            week5
                                ?.matchup_id ??
                            null,

                        week5Opponent:
                            opponent
                                ?.name ||
                            null,

                        week5Projection:
                            getProjectedPoints(
                                roster,
                                5
                            ),

                        week5TopProjected:
                            getTopProjectedStarters(
                                roster,
                                5
                            ),

                        week4TopPerformers:
                            getTopPerformers(
                                4,
                                rosterID
                            ),

                        rosterChanges:
                            getRosterChanges(
                                roster
                            ),

                        currentRoster:
                            (
                                roster
                                    .players ||
                                []
                            )
                                .map(
                                    (
                                        playerID
                                    ) => ({
                                        playerID,

                                        name:
                                            getPlayerName(
                                                playerID
                                            )
                                    })
                                )
                    };
                }
            );

    const output = {
        generatedAt:
            new Date()
                .toISOString(),

        week:
            5,

        teamCount:
            powerData.length,

        transactionCount:
            completedWeek5Transactions
                .length,

        transactions:
            completedWeek5Transactions,

        teams:
            powerData
    };
</script>

<svelte:head>
    <title>
        Power Rankings Data
    </title>
</svelte:head>

<div
    style="
        width: 95%;
        max-width: 1200px;
        margin: 2em auto;
    "
>
    <h1>
        Power Rankings Data
    </h1>

    <p>
        Temporary internal data export.
    </p>

    <pre
        style="
            white-space: pre-wrap;
            word-break: break-word;
            margin-top: 2em;
            padding: 1em;
            border: 1px solid var(--ccc);
            border-radius: 0.5em;
            font-size: 0.75em;
            overflow-x: auto;
        "
    >{JSON.stringify(output, null, 2)}</pre>
</div>
