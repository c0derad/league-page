<!-- Week 3 power rankings data -->
<script>
    export let data;

    const round = (value) =>
        Math.round(Number(value || 0) * 100) / 100;

    const getPlayerName = (playerID) => {
        const player =
            data.players?.[playerID];

        if (!player) {
            return playerID;
        }

        const first =
            player.fn || '';

        const last =
            player.ln || '';

        return `${first} ${last}`.trim();
    };

    const getTeamName = (rosterID) => {
        const manager =
            data.teamManagers?.find?.(
                (team) =>
                    Number(team.roster_id) ===
                    Number(rosterID)
            );

        return (
            manager?.team_name ||
            manager?.name ||
            manager?.display_name ||
            `Roster ${rosterID}`
        );
    };

    const getWeek1Matchup = (rosterID) =>
        data.week1Matchups.find(
            (item) =>
                Number(item.roster_id) ===
                Number(rosterID)
        );

    const getWeek2Matchup = (rosterID) =>
        data.week2Matchups.find(
            (item) =>
                Number(item.roster_id) ===
                Number(rosterID)
        );

    const getWeek3Matchup = (rosterID) =>
        data.week3Matchups.find(
            (item) =>
                Number(item.roster_id) ===
                Number(rosterID)
        );

    const getWeek3Opponent = (rosterID) => {
        const team =
            getWeek3Matchup(rosterID);

        if (!team) {
            return null;
        }

        const opponent =
            data.week3Matchups.find(
                (item) =>
                    item.matchup_id ===
                        team.matchup_id &&
                    Number(item.roster_id) !==
                        Number(rosterID)
            );

        if (!opponent) {
            return null;
        }

        return {
            rosterID:
                opponent.roster_id,

            name:
                getTeamName(
                    opponent.roster_id
                )
        };
    };

    const getProjectedPoints = (
        roster,
        week
    ) => {
        return round(
            (roster.starters || []).reduce(
                (total, playerID) => {
                    const player =
                        data.players?.[playerID];

                    return (
                        total +
                        Number(
                            player?.wi?.[week]?.p ||
                            0
                        )
                    );
                },
                0
            )
        );
    };

    const getTopProjectedStarters = (
        roster,
        week
    ) => {
        return (
            roster.starters || []
        )
            .map((playerID) => {
                const player =
                    data.players?.[playerID];

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
                            player?.wi?.[week]?.p ||
                            0
                        )
                };
            })
            .sort(
                (a, b) =>
                    b.projection -
                    a.projection
            )
            .slice(0, 5);
    };

    const getWeek2TopPerformers = (
        rosterID
    ) => {
        const matchup =
            getWeek2Matchup(
                rosterID
            );

        if (!matchup) {
            return [];
        }

        return (
            matchup.starters || []
        )
            .map((playerID) => ({
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
                            ] || 0
                    )
            }))
            .sort(
                (a, b) =>
                    b.points -
                    a.points
            )
            .slice(0, 5);
    };

    const getWeek2BenchPoints = (
        rosterID
    ) => {
        const matchup =
            getWeek2Matchup(
                rosterID
            );

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
                    (total, playerID) =>
                        total +
                        Number(
                            matchup
                                .players_points?.[
                                    playerID
                                ] || 0
                        ),
                    0
                )
        );
    };

    const getRosterChanges = (
        roster
    ) => {
        const previous =
            data.week2Snapshot
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
                previous.players || []
            );

        const currentPlayers =
            new Set(
                roster.players || []
            );

        const added =
            [...currentPlayers]
                .filter(
                    (id) =>
                        !oldPlayers.has(id)
                )
                .map((id) => ({
                    playerID: id,

                    name:
                        getPlayerName(id)
                }));

        const dropped =
            [...oldPlayers]
                .filter(
                    (id) =>
                        !currentPlayers.has(id)
                )
                .map((id) => ({
                    playerID: id,

                    name:
                        getPlayerName(id)
                }));

        return {
            added,
            dropped
        };
    };

    const getRecordThroughWeek2 = (
        rosterID
    ) => {
        let wins = 0;
        let losses = 0;
        let ties = 0;

        const weeks = [
            data.week1Matchups,
            data.week2Matchups
        ];

        for (const weekMatchups of weeks) {
            const team =
                weekMatchups.find(
                    (item) =>
                        Number(item.roster_id) ===
                        Number(rosterID)
                );

            if (!team) {
                continue;
            }

            const opponent =
                weekMatchups.find(
                    (item) =>
                        item.matchup_id ===
                            team.matchup_id &&
                        Number(item.roster_id) !==
                            Number(rosterID)
                );

            if (!opponent) {
                continue;
            }

            const teamPoints =
                Number(team.points || 0);

            const opponentPoints =
                Number(opponent.points || 0);

            if (teamPoints > opponentPoints) {
                wins++;
            } else if (
                teamPoints < opponentPoints
            ) {
                losses++;
            } else {
                ties++;
            }
        }

        if (ties > 0) {
            return `${wins}-${losses}-${ties}`;
        }

        return `${wins}-${losses}`;
    };

    const powerData =
        (data.currentRosters || [])
            .map((roster) => {
                const week1 =
                    getWeek1Matchup(
                        roster.roster_id
                    );

                const week2 =
                    getWeek2Matchup(
                        roster.roster_id
                    );

                const opponent =
                    getWeek3Opponent(
                        roster.roster_id
                    );

                return {
                    rosterID:
                        roster.roster_id,

                    team:
                        getTeamName(
                            roster.roster_id
                        ),

                    record:
                        getRecordThroughWeek2(
                            roster.roster_id
                        ),

                    week1Score:
                        round(
                            week1?.points ||
                            0
                        ),

                    week2Score:
                        round(
                            week2?.points ||
                            0
                        ),

                    week2BenchPoints:
                        getWeek2BenchPoints(
                            roster.roster_id
                        ),

                    week3Opponent:
                        opponent?.name ||
                        null,

                    week3Projection:
                        getProjectedPoints(
                            roster,
                            3
                        ),

                    week3TopProjected:
                        getTopProjectedStarters(
                            roster,
                            3
                        ),

                    week2TopPerformers:
                        getWeek2TopPerformers(
                            roster.roster_id
                        ),

                    rosterChanges:
                        getRosterChanges(
                            roster
                        ),

                    currentRoster:
                        (roster.players || [])
                            .map(
                                (playerID) => ({
                                    playerID,

                                    name:
                                        getPlayerName(
                                            playerID
                                        )
                                })
                            )
                };
            });

    const output = {
        generatedAt:
            new Date().toISOString(),

        week:
            3,

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
