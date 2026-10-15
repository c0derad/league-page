<script>
    export let data;

    const WEEK =
        Number(
            data.week
        );

    const PREVIOUS_WEEK =
        Number(
            data.previousWeek
        );

    /*
        Fallback only.

        Live Sleeper team names are preferred
        whenever available.

        Keeping roster IDs as the permanent
        identity means future team-name changes
        do not break anything.
    */
    const TEAM_NAMES = {
        1: 'The Car Bombs',
        2: 'PeterPanthers',
        3: 'The Oilers',
        4: 'Show Me Your TDs',
        5: 'Rhodes x Pags',
        6: 'Nigasaki',
        7: 'Retardinals',
        8: 'Naberhood Sex Offender',
        9: 'Charles',
        10: 'Moore Oil Coming',
        11: 'Campus Legends',
        12: 'Big frydown'
    };

    const round = (
        value
    ) =>
        Math.round(
            Number(
                value || 0
            ) * 100
        ) / 100;

    const getPlayer = (
        playerID
    ) =>
        data.players?.[
            playerID
        ] ||
        null;

    const getPlayerName = (
        playerID
    ) => {
        const player =
            getPlayer(
                playerID
            );

        if (!player) {
            return String(
                playerID
            );
        }

        const first =
            player.fn ||
            '';

        const last =
            player.ln ||
            '';

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
                    (
                        team
                    ) =>
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

            manager
                ?.team_name ||

            TEAM_NAMES[
                Number(
                    rosterID
                )
            ] ||

            manager
                ?.name ||

            manager
                ?.display_name ||

            `Roster ${rosterID}`
        );
    };

    const getMatchupsForWeek = (
        week
    ) => {
        if (
            !week ||
            week < 1
        ) {
            return [];
        }

        return (
            data
                .matchupsByWeek?.[
                    week
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
                    (
                        item
                    ) =>
                        Number(
                            item.roster_id
                        ) ===
                        Number(
                            rosterID
                        )
                ) ||
            null
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
                    (
                        item
                    ) =>
                        Number(
                            item.matchup_id
                        ) ===
                            Number(
                                team.matchup_id
                            ) &&

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

    const getPlayerProjection = (
        playerID,
        week
    ) => {
        return Number(
            getPlayer(
                playerID
            )?.wi?.[
                week
            ]?.p ||
            0
        );
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
                    ) =>
                        total +
                        getPlayerProjection(
                            playerID,
                            week
                        ),
                    0
                )
        );
    };

    const mapProjectedStarter = (
        playerID,
        week
    ) => {
        const player =
            getPlayer(
                playerID
            );

        return {
            playerID,

            name:
                getPlayerName(
                    playerID
                ),

            position:
                player?.pos ||
                null,

            nflTeam:
                player?.t ||
                null,

            projection:
                round(
                    getPlayerProjection(
                        playerID,
                        week
                    )
                ),

            injuryStatus:
                player
                    ?.injury_status ||
                null,

            status:
                player
                    ?.status ||
                null
        };
    };

    const getProjectedStarters = (
        roster,
        week
    ) => {
        return (
            roster.starters ||
            []
        )
            .filter(
                (
                    playerID
                ) =>
                    playerID &&
                    playerID !== '0'
            )
            .map(
                (
                    playerID
                ) =>
                    mapProjectedStarter(
                        playerID,
                        week
                    )
            )
            .sort(
                (
                    a,
                    b
                ) =>
                    b.projection -
                    a.projection
            );
    };

    const getTopProjectedStarters = (
        roster,
        week
    ) => {
        return (
            getProjectedStarters(
                roster,
                week
            )
                .slice(
                    0,
                    5
                )
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
            .filter(
                (
                    playerID
                ) =>
                    playerID &&
                    playerID !== '0'
            )
            .map(
                (
                    playerID
                ) => {
                    const player =
                        getPlayer(
                            playerID
                        );

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

                        points:
                            round(
                                matchup
                                    .players_points?.[
                                        playerID
                                    ] ||
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
                        playerID &&
                        playerID !== '0' &&
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

    const getRecordThroughWeek = (
        rosterID,
        throughWeek
    ) => {
        let wins = 0;
        let losses = 0;
        let ties = 0;

        for (
            let week = 1;
            week <=
                throughWeek;
            week++
        ) {
            const team =
                getMatchup(
                    week,
                    rosterID
                );

            if (!team) {
                continue;
            }

            const opponent =
                getMatchupsForWeek(
                    week
                )
                    .find(
                        (
                            item
                        ) =>
                            Number(
                                item.matchup_id
                            ) ===
                                Number(
                                    team.matchup_id
                                ) &&

                            Number(
                                item.roster_id
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
            ties > 0
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
        return Object
            .entries(
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

        const playerIDs = [
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
                (
                    item
                ) => ({
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
                (
                    pick
                ) => ({
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
                    (
                        id
                    ) =>
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

    const completedTransactions =
        (
            data.transactions ||
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

    /*
        Instead of relying on an old
        rosterHistory snapshot, derive the
        recent changes directly from Sleeper's
        completed transactions.

        This makes the route reusable every week.
    */
    const getRosterChanges = (
        rosterID
    ) => {
        const addedMap =
            new Map();

        const droppedMap =
            new Map();

        for (
            const transaction
            of completedTransactions
        ) {
            for (
                const add
                of transaction.adds
            ) {
                if (
                    Number(
                        add.rosterID
                    ) ===
                    Number(
                        rosterID
                    )
                ) {
                    addedMap.set(
                        add.playerID,
                        {
                            playerID:
                                add.playerID,

                            name:
                                add.name
                        }
                    );
                }
            }

            for (
                const drop
                of transaction.drops
            ) {
                if (
                    Number(
                        drop.rosterID
                    ) ===
                    Number(
                        rosterID
                    )
                ) {
                    droppedMap.set(
                        drop.playerID,
                        {
                            playerID:
                                drop.playerID,

                            name:
                                drop.name
                        }
                    );
                }
            }
        }

        return {
            added:
                [
                    ...addedMap
                        .values()
                ],

            dropped:
                [
                    ...droppedMap
                        .values()
                ]
        };
    };

    const getTeamTransactions = (
        rosterID
    ) => {
        return completedTransactions
            .filter(
                (
                    transaction
                ) =>
                    transaction
                        .rosterIDs
                        .includes(
                            Number(
                                rosterID
                            )
                        )
            );
    };

    const mapCurrentRosterPlayer = (
        playerID
    ) => {
        const player =
            getPlayer(
                playerID
            );

        return {
            playerID,

            name:
                getPlayerName(
                    playerID
                ),

            position:
                player?.pos ||
                null,

            nflTeam:
                player?.t ||
                null,

            injuryStatus:
                player
                    ?.injury_status ||
                null,

            status:
                player
                    ?.status ||
                null,

            weekProjection:
                round(
                    getPlayerProjection(
                        playerID,
                        WEEK
                    )
                )
        };
    };

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

                    const previousMatchup =
                        PREVIOUS_WEEK >= 1
                            ? getMatchup(
                                PREVIOUS_WEEK,
                                rosterID
                            )
                            : null;

                    const currentMatchup =
                        getMatchup(
                            WEEK,
                            rosterID
                        );

                    const opponent =
                        getOpponent(
                            WEEK,
                            rosterID
                        );

                    const previousScoreKey =
                        `week${PREVIOUS_WEEK}Score`;

                    const previousBenchKey =
                        `week${PREVIOUS_WEEK}BenchPoints`;

                    const currentMatchupIDKey =
                        `week${WEEK}MatchupID`;

                    const currentOpponentKey =
                        `week${WEEK}Opponent`;

                    const currentProjectionKey =
                        `week${WEEK}Projection`;

                    const currentTopProjectedKey =
                        `week${WEEK}TopProjected`;

                    const currentProjectedStartersKey =
                        `week${WEEK}ProjectedStarters`;

                    const previousTopPerformersKey =
                        `week${PREVIOUS_WEEK}TopPerformers`;

                    const weekScores = {};

                    for (
                        let week = 1;
                        week <=
                            PREVIOUS_WEEK;
                        week++
                    ) {
                        const matchup =
                            getMatchup(
                                week,
                                rosterID
                            );

                        weekScores[
                            `week${week}Score`
                        ] =
                            round(
                                matchup
                                    ?.points ||
                                0
                            );
                    }

                    return {
                        rosterID,

                        team:
                            getTeamName(
                                rosterID
                            ),

                        record:
                            getRecordThroughWeek(
                                rosterID,
                                PREVIOUS_WEEK
                            ),

                        ...weekScores,

                        [previousScoreKey]:
                            round(
                                previousMatchup
                                    ?.points ||
                                0
                            ),

                        [previousBenchKey]:
                            getBenchPoints(
                                PREVIOUS_WEEK,
                                rosterID
                            ),

                        [currentMatchupIDKey]:
                            currentMatchup
                                ?.matchup_id ??
                            null,

                        [currentOpponentKey]:
                            opponent
                                ?.name ||
                            null,

                        [currentProjectionKey]:
                            getProjectedPoints(
                                roster,
                                WEEK
                            ),

                        [currentTopProjectedKey]:
                            getTopProjectedStarters(
                                roster,
                                WEEK
                            ),

                        [currentProjectedStartersKey]:
                            getProjectedStarters(
                                roster,
                                WEEK
                            ),

                        [previousTopPerformersKey]:
                            PREVIOUS_WEEK >= 1
                                ? getTopPerformers(
                                    PREVIOUS_WEEK,
                                    rosterID
                                )
                                : [],

                        rosterChanges:
                            getRosterChanges(
                                rosterID
                            ),

                        recentTransactions:
                            getTeamTransactions(
                                rosterID
                            ),

                        currentRoster:
                            (
                                roster.players ||
                                []
                            )
                                .map(
                                    mapCurrentRosterPlayer
                                )
                                .sort(
                                    (
                                        a,
                                        b
                                    ) =>
                                        b.weekProjection -
                                        a.weekProjection
                                )
                    };
                }
            )
            .sort(
                (
                    a,
                    b
                ) =>
                    a.rosterID -
                    b.rosterID
            );

    const getPowerTeam = (
        rosterID
    ) =>
        powerData.find(
            (
                team
            ) =>
                Number(
                    team.rosterID
                ) ===
                Number(
                    rosterID
                )
        );

    /*
        Also create six clean matchup objects.

        This saves us from having to reconstruct
        the Week 6 slate manually after you paste
        the JSON into ChatGPT.
    */
    const matchupGroups =
        {};

    for (
        const matchup
        of getMatchupsForWeek(
            WEEK
        )
    ) {
        if (
            matchup.matchup_id ===
                null ||
            matchup.matchup_id ===
                undefined
        ) {
            continue;
        }

        const matchupID =
            Number(
                matchup.matchup_id
            );

        if (
            !matchupGroups[
                matchupID
            ]
        ) {
            matchupGroups[
                matchupID
            ] = [];
        }

        matchupGroups[
            matchupID
        ].push(
            matchup
        );
    }

    const matchupSummaries =
        Object
            .entries(
                matchupGroups
            )
            .map(
                ([
                    matchupID,
                    matchups
                ]) => {
                    const teams =
                        matchups
                            .map(
                                (
                                    matchup
                                ) => {
                                    const team =
                                        getPowerTeam(
                                            matchup
                                                .roster_id
                                        );

                                    return {
                                        rosterID:
                                            Number(
                                                matchup
                                                    .roster_id
                                            ),

                                        team:
                                            team
                                                ?.team ||
                                            getTeamName(
                                                matchup
                                                    .roster_id
                                            ),

                                        record:
                                            team
                                                ?.record ||
                                            null,

                                        projection:
                                            team?.[
                                                `week${WEEK}Projection`
                                            ] ??
                                            0
                                    };
                                }
                            );

                    return {
                        matchupID:
                            Number(
                                matchupID
                            ),

                        teams,

                        projectedTotal:
                            round(
                                teams.reduce(
                                    (
                                        total,
                                        team
                                    ) =>
                                        total +
                                        Number(
                                            team
                                                .projection ||
                                            0
                                        ),
                                    0
                                )
                            ),

                        projectedMargin:
                            teams.length === 2
                                ? round(
                                    Math.abs(
                                        Number(
                                            teams[
                                                0
                                            ]
                                                .projection ||
                                            0
                                        ) -
                                        Number(
                                            teams[
                                                1
                                            ]
                                                .projection ||
                                            0
                                        )
                                    )
                                )
                                : null
                    };
                }
            )
            .sort(
                (
                    a,
                    b
                ) =>
                    a.matchupID -
                    b.matchupID
            );

    const output = {
        generatedAt:
            new Date()
                .toISOString(),

        week:
            WEEK,

        previousWeek:
            PREVIOUS_WEEK,

        teamCount:
            powerData.length,

        transactionCount:
            completedTransactions
                .length,

        transactions:
            completedTransactions,

        matchups:
            matchupSummaries,

        teams:
            powerData
    };
</script>

<svelte:head>
    <title>
        Week {WEEK} Preview Data
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
        Week {WEEK} Preview Data
    </h1>

    <p>
        Dynamic Sleeper data export for Week {WEEK}.
    </p>

    <p
        style="
            color: #888;
            font-size: 0.85em;
        "
    >
        Includes Week {PREVIOUS_WEEK} results,
        Week {WEEK} projections,
        records, rosters, injuries and recent transactions.
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
