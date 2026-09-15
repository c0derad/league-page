<script>
    import {
        getTeamFromTeamManagers,
        round
    } from '$lib/utils/helperFunctions/universalFunctions';

    import {
        weeklyRecaps
    } from '$lib/utils/weeklyRecaps';

    import {
        weeklyPreviews
    } from '$lib/utils/weeklyPreviews';

    export let data;

    let loading = true;
    let recapData = null;

    const playerName = (
        player,
        playerID
    ) => {
        if (!player) {
            return `Player ${playerID}`;
        }

        return (
            `${player.fn || ''} ${player.ln || ''}`.trim() ||
            `Player ${playerID}`
        );
    };

    const getFootballStatLine = (
        player
    ) => {
        const stats =
            player?.actual;

        if (!stats) {
            return '';
        }

        const position =
            player.position;

        const parts = [];

        if (position === 'QB') {
            if (
                stats.passing?.attempts > 0
            ) {
                parts.push(
                    `${stats.passing.completions}/${stats.passing.attempts} PASS`
                );

                parts.push(
                    `${stats.passing.yards} PASS YDS`
                );

                if (
                    stats.passing.touchdowns > 0
                ) {
                    parts.push(
                        `${stats.passing.touchdowns} PASS TD`
                    );
                }

                if (
                    stats.passing.interceptions > 0
                ) {
                    parts.push(
                        `${stats.passing.interceptions} INT`
                    );
                }
            }

            if (
                stats.rushing?.attempts > 0
            ) {
                parts.push(
                    `${stats.rushing.attempts} CAR`
                );

                parts.push(
                    `${stats.rushing.yards} RUSH YDS`
                );

                if (
                    stats.rushing.touchdowns > 0
                ) {
                    parts.push(
                        `${stats.rushing.touchdowns} RUSH TD`
                    );
                }
            }
        }

        if (
            ['RB', 'FB'].includes(
                position
            )
        ) {
            if (
                stats.rushing?.attempts > 0
            ) {
                parts.push(
                    `${stats.rushing.attempts} CAR`
                );

                parts.push(
                    `${stats.rushing.yards} RUSH YDS`
                );

                if (
                    stats.rushing.touchdowns > 0
                ) {
                    parts.push(
                        `${stats.rushing.touchdowns} RUSH TD`
                    );
                }
            }

            if (
                stats.receiving?.targets > 0
            ) {
                parts.push(
                    `${stats.receiving.receptions}/${stats.receiving.targets} REC`
                );

                parts.push(
                    `${stats.receiving.yards} REC YDS`
                );

                if (
                    stats.receiving.touchdowns > 0
                ) {
                    parts.push(
                        `${stats.receiving.touchdowns} REC TD`
                    );
                }
            }
        }

        if (
            ['WR', 'TE'].includes(
                position
            )
        ) {
            if (
                stats.receiving?.targets > 0
            ) {
                parts.push(
                    `${stats.receiving.receptions}/${stats.receiving.targets} REC`
                );

                parts.push(
                    `${stats.receiving.yards} REC YDS`
                );

                if (
                    stats.receiving.touchdowns > 0
                ) {
                    parts.push(
                        `${stats.receiving.touchdowns} REC TD`
                    );
                }
            }

            if (
                stats.rushing?.attempts > 0
            ) {
                parts.push(
                    `${stats.rushing.attempts} CAR`
                );

                parts.push(
                    `${stats.rushing.yards} RUSH YDS`
                );

                if (
                    stats.rushing.touchdowns > 0
                ) {
                    parts.push(
                        `${stats.rushing.touchdowns} RUSH TD`
                    );
                }
            }
        }

        if (
            stats.fumbles?.lost > 0
        ) {
            parts.push(
                `${stats.fumbles.lost} FUM LOST`
            );
        }

        return parts.join(' · ');
    };

    const getFumbleDebug = (
        player
    ) => {
        const debug =
            player?.actual?.debugFumbles;

        if (!debug) {
            return 'NO DEBUG DATA';
        }

        const entries =
            Object.entries(debug);

        if (!entries.length) {
            return 'NO FUMBLE COLUMNS FOUND';
        }

        return entries
            .map(
                ([key, value]) =>
                    `${key}=${value}`
            )
            .join(' | ');
    };

    const getPlayerPerformances = (
        matchup,
        players,
        startersOnly = true
    ) => {
        const ids =
            startersOnly
                ? matchup.starters || []
                : matchup.players || [];

        return ids
            .map(
                (playerID) => {
                    if (
                        !playerID ||
                        playerID === '0'
                    ) {
                        return null;
                    }

                    const player =
                        players[playerID];

                    const points =
                        Number(
                            matchup.players_points?.[
                                playerID
                            ] ?? 0
                        );

                    const actual =
                        data.nflStats?.[
                            playerID
                        ] || null;

                    return {
                        playerID,

                        name:
                            actual?.name ||
                            playerName(
                                player,
                                playerID
                            ),

                        position:
                            actual?.position ||
                            player?.pos ||
                            '',

                        nflTeam:
                            actual?.team ||
                            player?.t ||
                            '',

                        points:
                            Number(
                                round(points)
                            ),

                        actual
                    };
                }
            )
            .filter(Boolean)
            .sort(
                (a, b) =>
                    b.points -
                    a.points
            );
    };

    const getBenchPerformances = (
        matchup,
        players
    ) => {
        const starters =
            new Set(
                matchup.starters || []
            );

        return (
            matchup.players || []
        )
            .filter(
                (playerID) =>
                    playerID &&
                    !starters.has(
                        playerID
                    )
            )
            .map(
                (playerID) => {
                    const player =
                        players[playerID];

                    const actual =
                        data.nflStats?.[
                            playerID
                        ] || null;

                    return {
                        playerID,

                        name:
                            actual?.name ||
                            playerName(
                                player,
                                playerID
                            ),

                        position:
                            actual?.position ||
                            player?.pos ||
                            '',

                        nflTeam:
                            actual?.team ||
                            player?.t ||
                            '',

                        points:
                            Number(
                                round(
                                    Number(
                                        matchup.players_points?.[
                                            playerID
                                        ] ?? 0
                                    )
                                )
                            ),

                        actual
                    };
                }
            )
            .sort(
                (a, b) =>
                    b.points -
                    a.points
            );
    };

    const getTeamAvatar = (
        team
    ) => {
        if (!team) {
            return null;
        }

        const avatar =
            team.avatar ||
            team.metadata?.avatar ||
            team.user?.avatar ||
            team.manager?.avatar ||
            null;

        if (!avatar) {
            return null;
        }

        if (
            avatar.startsWith(
                'http://'
            ) ||
            avatar.startsWith(
                'https://'
            )
        ) {
            return avatar;
        }

        return `https://sleepercdn.com/avatars/thumbs/${avatar}`;
    };

    const buildRecap = (
        rawMatchups,
        leagueTeamManagers,
        playersData
    ) => {
        const players =
            playersData.players;

        const week =
            Number(data.week);

        const editorial =
            weeklyRecaps[week] ||
            null;

        const preview =
            weeklyPreviews[week] ||
            null;

        const grouped = {};

        for (
            const matchup of rawMatchups
        ) {
            if (
                !grouped[
                    matchup.matchup_id
                ]
            ) {
                grouped[
                    matchup.matchup_id
                ] = [];
            }

            grouped[
                matchup.matchup_id
            ].push(matchup);
        }

        const games = [];

        for (
            const matchupID
            in grouped
        ) {
            const teams =
                grouped[matchupID];

            if (
                teams.length < 2
            ) {
                continue;
            }

            const teamA =
                teams[0];

            const teamB =
                teams[1];

            const teamAInfo =
                getTeamFromTeamManagers(
                    leagueTeamManagers,
                    teamA.roster_id
                );

            const teamBInfo =
                getTeamFromTeamManagers(
                    leagueTeamManagers,
                    teamB.roster_id
                );

            const teamAPoints =
                Number(
                    teamA.points || 0
                );

            const teamBPoints =
                Number(
                    teamB.points || 0
                );

            const winner =
                teamAPoints >=
                teamBPoints
                    ? teamAInfo
                    : teamBInfo;

            const loser =
                teamAPoints >=
                teamBPoints
                    ? teamBInfo
                    : teamAInfo;

            const winnerPoints =
                Math.max(
                    teamAPoints,
                    teamBPoints
                );

            const loserPoints =
                Math.min(
                    teamAPoints,
                    teamBPoints
                );

            const margin =
                Number(
                    round(
                        winnerPoints -
                        loserPoints
                    )
                );

            const teamATopPlayers =
                getPlayerPerformances(
                    teamA,
                    players
                ).slice(0, 3);

            const teamBTopPlayers =
                getPlayerPerformances(
                    teamB,
                    players
                ).slice(0, 3);

            const teamABench =
                getBenchPerformances(
                    teamA,
                    players
                ).slice(0, 3);

            const teamBBench =
                getBenchPerformances(
                    teamB,
                    players
                ).slice(0, 3);

            const commentary =
                editorial
                    ?.matchups
                    ?.[matchupID] ||
                null;

            const previewPick =
                preview
                    ?.matchups
                    ?.[matchupID]
                    ?.pick ||
                null;

            const pickCorrect =
                previewPick
                    ? previewPick ===
                      winner?.name
                    : null;

            games.push({
                matchupID,

                teamA,
                teamB,

                teamAInfo,
                teamBInfo,

                teamAPoints,
                teamBPoints,

                teamAAvatar:
                    getTeamAvatar(
                        teamAInfo
                    ),

                teamBAvatar:
                    getTeamAvatar(
                        teamBInfo
                    ),

                teamATopPlayers,
                teamBTopPlayers,

                teamABench,
                teamBBench,

                winner,
                loser,

                winnerPoints,
                loserPoints,

                margin,

                commentary,

                previewPick,
                pickCorrect
            });
        }

        const sortedScores = [];

        for (
            const game of games
        ) {
            sortedScores.push({
                team:
                    game.teamAInfo,

                points:
                    game.teamAPoints
            });

            sortedScores.push({
                team:
                    game.teamBInfo,

                points:
                    game.teamBPoints
            });
        }

        sortedScores.sort(
            (a, b) =>
                b.points -
                a.points
        );

        const highMan =
            sortedScores[0];

        const lowMan =
            sortedScores[
                sortedScores.length -
                    1
            ];

        const byMargin =
            [...games].sort(
                (a, b) =>
                    b.margin -
                    a.margin
            );

        const biggestBlowout =
            byMargin[0];

        const closestGame =
            [...games].sort(
                (a, b) =>
                    a.margin -
                    b.margin
            )[0];

        const picks =
            games.filter(
                (game) =>
                    game.previewPick !==
                    null
            );

        const correctPicks =
            picks.filter(
                (game) =>
                    game.pickCorrect
            ).length;

        return {
            week,

            intro:
                editorial?.intro ||
                null,

            games,

            highMan,
            lowMan,

            biggestBlowout,
            closestGame,

            correctPicks,

            totalPicks:
                picks.length
        };
    };

    Promise.all([
        data.leagueTeamManagersData,
        data.playersData
    ]).then(
        ([
            leagueTeamManagers,
            playersData
        ]) => {
            recapData =
                buildRecap(
                    data.rawMatchups,
                    leagueTeamManagers,
                    playersData
                );

            loading = false;
        }
    );
</script>

<svelte:head>
    <title>
        Weekly Recap | TouchDown Syndrome
    </title>
</svelte:head>

<style>
    .page {
        width: 94%;
        max-width: 1000px;
        margin: 0 auto;
        padding: 3em 0 6em;
    }

    .title {
        text-align: center;
        font-size: 2.8em;
        margin-bottom: 0.25em;
    }

    .subtitle {
        text-align: center;
        color: #888;
        font-style: italic;
        margin-bottom: 2em;
    }

    .intro {
        max-width: 780px;
        margin: 0 auto 3em;
        text-align: center;
        line-height: 1.65em;
        white-space: pre-line;
    }

    .featureGrid {
        display: grid;
        grid-template-columns:
            repeat(
                4,
                minmax(0, 1fr)
            );
        gap: 1em;
        margin-bottom: 2em;
    }

    .feature {
        border:
            1px solid
            var(--ccc);

        border-radius: 1em;
        padding: 1.1em;
        text-align: center;
        background: var(--fff);

        box-shadow:
            0 0 6px
            var(--bbb);
    }

    .featureLabel {
        font-size: 0.72em;
        letter-spacing: 0.08em;
        font-weight: 700;
        color: #888;
        margin-bottom: 0.5em;
    }

    .featureTeam {
        font-weight: 700;
    }

    .featureScore {
        margin-top: 0.35em;
        font-size: 1.4em;
        font-weight: 700;
    }

    .czarRecord {
        text-align: center;
        margin:
            0 auto 3em;
        font-weight: 700;
    }

    .game {
        border:
            1px solid
            var(--ccc);

        border-radius: 1em;
        margin: 1.5em 0;
        overflow: hidden;

        box-shadow:
            0 0 6px
            var(--bbb);

        background:
            var(--fff);
    }

    .scoreboard {
        display: grid;

        grid-template-columns:
            1fr auto 1fr;

        align-items: center;
        gap: 1em;
        padding: 1.5em;
    }

    .team {
        text-align: center;
    }

    .teamIdentity {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 0.7em;
    }

    .avatar {
        width: 46px;
        height: 46px;
        object-fit: cover;
        border-radius: 50%;
    }

    .teamName {
        font-weight: 700;
    }

    .score {
        font-size: 2.1em;
        font-weight: 700;
        margin-top: 0.35em;
    }

    .winner .score {
        font-weight: 900;
    }

    .vs {
        color: #999;
        font-weight: 700;
    }

    .resultBar {
        background:
            var(--eee);

        text-align: center;
        padding: 0.7em;
        font-size: 0.9em;
    }

    .players {
        display: grid;

        grid-template-columns:
            1fr 1fr;

        gap: 1.5em;

        padding:
            1.3em 1.5em;

        border-bottom:
            1px solid
            var(--ccc);
    }

    .playerHeader {
        font-size: 0.75em;
        font-weight: 700;
        color: #888;
        letter-spacing: 0.06em;
        margin-bottom: 0.7em;
    }

    .playerRow {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 1em;
        padding: 0.5em 0;
    }

    .playerInfo {
        min-width: 0;
    }

    .playerName {
        font-weight: 700;
    }

    .playerMeta {
        display: block;
        margin-top: 0.1em;
        font-size: 0.75em;
        color: #888;
    }

    .footballStats {
        display: block;
        margin-top: 0.22em;
        font-size: 0.78em;
        line-height: 1.35em;
        color: #666;
    }

    .debugFumbles {
        display: block;

        margin-top:
            0.4em;

        padding:
            0.4em 0.55em;

        font-size:
            0.65em;

        line-height:
            1.4em;

        word-break:
            break-word;

        background:
            #fff3cd;

        color:
            #6b5600;

        border-radius:
            0.35em;
    }

    .playerPoints {
        flex-shrink: 0;
        font-weight: 700;
        font-size: 1.05em;
    }

    .fantasyLabel {
        display: block;
        margin-top: 0.1em;
        font-size: 0.62em;
        font-weight: 500;
        color: #999;
        text-align: right;
    }

    .recapCopy {
        padding:
            1.4em 1.6em
            1.6em;
    }

    .czarTitle {
        font-size: 0.75em;
        font-weight: 700;
        color: #888;
        letter-spacing: 0.1em;
    }

    .recapHeadline {
        margin:
            0.45em 0
            0.75em;
    }

    .recapText {
        white-space: pre-line;
        line-height: 1.65em;
    }

    .pickResult {
        margin-top: 1em;
        font-size: 0.9em;
        font-weight: 700;
    }

    .loading {
        text-align: center;
        padding: 6em 0;
    }

    @media (
        max-width: 760px
    ) {
        .featureGrid {
            grid-template-columns:
                1fr 1fr;
        }

        .players {
            grid-template-columns:
                1fr;
        }
    }

    @media (
        max-width: 500px
    ) {
        .featureGrid {
            grid-template-columns:
                1fr;
        }

        .scoreboard {
            padding: 1em;
        }

        .avatar {
            width: 36px;
            height: 36px;
        }

        .score {
            font-size: 1.6em;
        }

        .title {
            font-size: 2.2em;
        }

        .teamIdentity {
            flex-direction:
                column;

            gap: 0.35em;
        }
    }
</style>

<div class="page">

    {#if loading}

        <div class="loading">
            Building weekly recap...
        </div>

    {:else if recapData}

        <h1 class="title">
            Week {recapData.week} Recap
        </h1>

        <div class="subtitle">
            Judgment has been rendered.
        </div>

        {#if recapData.intro}

            <div class="intro">
                {recapData.intro}
            </div>

        {/if}

        <div class="featureGrid">

            <div class="feature">

                <div class="featureLabel">
                    HIGH MAN
                </div>

                <div class="featureTeam">
                    {recapData.highMan.team.name}
                </div>

                <div class="featureScore">
                    {recapData.highMan.points}
                </div>

            </div>

            <div class="feature">

                <div class="featureLabel">
                    LOW MAN
                </div>

                <div class="featureTeam">
                    {recapData.lowMan.team.name}
                </div>

                <div class="featureScore">
                    {recapData.lowMan.points}
                </div>

            </div>

            <div class="feature">

                <div class="featureLabel">
                    BIGGEST ASS BEATING
                </div>

                <div class="featureTeam">
                    {recapData.biggestBlowout.winner.name}
                    over
                    {recapData.biggestBlowout.loser.name}
                </div>

                <div class="featureScore">
                    {recapData.biggestBlowout.margin}
                </div>

            </div>

            <div class="feature">

                <div class="featureLabel">
                    CLOSEST GAME
                </div>

                <div class="featureTeam">
                    {recapData.closestGame.winner.name}
                    over
                    {recapData.closestGame.loser.name}
                </div>

                <div class="featureScore">
                    {recapData.closestGame.margin}
                </div>

            </div>

        </div>

        <div class="czarRecord">

            CZAR PICKS:
            {recapData.correctPicks}-{recapData.totalPicks - recapData.correctPicks}

        </div>

        {#each recapData.games as game}

            <div class="game">

                <div class="scoreboard">

                    <div
                        class:team={true}
                        class:winner={game.teamAPoints > game.teamBPoints}
                    >

                        <div class="teamIdentity">

                            {#if game.teamAAvatar}

                                <img
                                    class="avatar"
                                    src={game.teamAAvatar}
                                    alt={game.teamAInfo.name}
                                />

                            {/if}

                            <div class="teamName">
                                {game.teamAInfo.name}
                            </div>

                        </div>

                        <div class="score">
                            {game.teamAPoints}
                        </div>

                    </div>

                    <div class="vs">
                        FINAL
                    </div>

                    <div
                        class:team={true}
                        class:winner={game.teamBPoints > game.teamAPoints}
                    >

                        <div class="teamIdentity">

                            {#if game.teamBAvatar}

                                <img
                                    class="avatar"
                                    src={game.teamBAvatar}
                                    alt={game.teamBInfo.name}
                                />

                            {/if}

                            <div class="teamName">
                                {game.teamBInfo.name}
                            </div>

                        </div>

                        <div class="score">
                            {game.teamBPoints}
                        </div>

                    </div>

                </div>

                <div class="resultBar">

                    {game.winner.name}
                    wins by
                    {game.margin}

                </div>

                <div class="players">

                    <div>

                        <div class="playerHeader">
                            {game.teamAInfo.name} — TOP PERFORMERS
                        </div>

                        {#each game.teamATopPlayers as player}

                            <div class="playerRow">

                                <div class="playerInfo">

                                    <span class="playerName">
                                        {player.name}
                                    </span>

                                    <span class="playerMeta">

                                        {player.position}

                                        {#if player.nflTeam}
                                            · {player.nflTeam}
                                        {/if}

                                        {#if player.actual?.opponent}
                                            · vs {player.actual.opponent}
                                        {/if}

                                    </span>

                                    {#if getFootballStatLine(player)}

                                        <span class="footballStats">
                                            {getFootballStatLine(player)}
                                        </span>

                                    {/if}

                                    <span class="debugFumbles">
                                        FUMBLE DEBUG:
                                        {getFumbleDebug(player)}
                                    </span>

                                </div>

                                <div class="playerPoints">

                                    {player.points}

                                    <span class="fantasyLabel">
                                        FPTS
                                    </span>

                                </div>

                            </div>

                        {/each}

                    </div>

                    <div>

                        <div class="playerHeader">
                            {game.teamBInfo.name} — TOP PERFORMERS
                        </div>

                        {#each game.teamBTopPlayers as player}

                            <div class="playerRow">

                                <div class="playerInfo">

                                    <span class="playerName">
                                        {player.name}
                                    </span>

                                    <span class="playerMeta">

                                        {player.position}

                                        {#if player.nflTeam}
                                            · {player.nflTeam}
                                        {/if}

                                        {#if player.actual?.opponent}
                                            · vs {player.actual.opponent}
                                        {/if}

                                    </span>

                                    {#if getFootballStatLine(player)}

                                        <span class="footballStats">
                                            {getFootballStatLine(player)}
                                        </span>

                                    {/if}

                                    <span class="debugFumbles">
                                        FUMBLE DEBUG:
                                        {getFumbleDebug(player)}
                                    </span>

                                </div>

                                <div class="playerPoints">

                                    {player.points}

                                    <span class="fantasyLabel">
                                        FPTS
                                    </span>

                                </div>

                            </div>

                        {/each}

                    </div>

                </div>

                <div class="recapCopy">

                    <div class="czarTitle">
                        THE CZAR'S VERDICT
                    </div>

                    {#if game.commentary}

                        <h3 class="recapHeadline">
                            {game.commentary.headline}
                        </h3>

                        <div class="recapText">
                            {game.commentary.recap}
                        </div>

                    {/if}

                    {#if game.previewPick}

                        <div class="pickResult">

                            CZAR PICK:
                            {game.previewPick}

                            —
                            {game.pickCorrect
                                ? 'CORRECT'
                                : 'WRONG'}

                        </div>

                    {/if}

                </div>

            </div>

        {/each}

    {/if}

</div>
