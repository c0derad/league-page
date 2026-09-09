<script>
    import {
        getTeamFromTeamManagers,
        round
    } from '$lib/utils/helperFunctions/universalFunctions';

    import { weeklyPreviews } from '$lib/utils/weeklyPreviews';

    export let data;

    let loading = true;
    let previewData = null;

    const getProjection = (starters, players, week) => {
        let total = 0;

        for (const starter of starters || []) {
            if (!starter || starter == 0) continue;

            const player = players[starter];
            if (!player) continue;

            const projection =
                player.wi?.[week]?.p
                    ? Number(player.wi[week].p)
                    : 0;

            total += projection;
        }

        return Number(round(total));
    };

    const getTopProjectedPlayers = (
        starters,
        players,
        week,
        count = 3
    ) => {
        return (starters || [])
            .map((playerID) => {
                if (!playerID || playerID == 0) return null;

                const player = players[playerID];
                console.log('PLAYER DEBUG', playerID, player);
                if (!player) return null;

                const projection =
                    player.wi?.[week]?.p
                        ? Number(player.wi[week].p)
                        : 0;

                const name =
                    player.full_name ||
                    player.name ||
                    `${player.first_name || ''} ${player.last_name || ''}`.trim() ||
                    `Player ${playerID}`;

                return {
                    playerID,
                    name,
                    position: player.position || '',
                    nflTeam: player.team || '',
                    projection: Number(round(projection))
                };
            })
            .filter(Boolean)
            .sort((a, b) => b.projection - a.projection)
            .slice(0, count);
    };

    const getTeamAvatar = (team) => {
        if (!team) return null;

        const avatar =
            team.avatar ||
            team.metadata?.avatar ||
            team.user?.avatar ||
            team.manager?.avatar ||
            null;

        if (!avatar) return null;

        if (
            avatar.startsWith('http://') ||
            avatar.startsWith('https://')
        ) {
            return avatar;
        }

        return `https://sleepercdn.com/avatars/thumbs/${avatar}`;
    };

    const buildPreview = (
        matchupsData,
        leagueTeamManagers,
        playersData
    ) => {
        const players = playersData.players;

        const requestedWeek =
            Number(data.queryWeek) ||
            Number(matchupsData.week) ||
            1;

        const editorial =
            weeklyPreviews[requestedWeek] || null;

        const matchupWeek =
            matchupsData.matchupWeeks.find(
                (m) => Number(m.week) === requestedWeek
            );

        if (!matchupWeek) {
            return {
                week: requestedWeek,
                intro: editorial?.intro || null,
                games: [],
                gameOfWeek: null,
                shootout: null,
                blowout: null
            };
        }

        const games = [];

        for (const matchupID in matchupWeek.matchups) {
            const teams =
                matchupWeek.matchups[matchupID];

            if (!teams || teams.length < 2) continue;

            const home = teams[0];
            const away = teams[1];

            const homeTeam =
                getTeamFromTeamManagers(
                    leagueTeamManagers,
                    home.roster_id,
                    matchupsData.year
                );

            const awayTeam =
                getTeamFromTeamManagers(
                    leagueTeamManagers,
                    away.roster_id,
                    matchupsData.year
                );

            const homeProjection =
                getProjection(
                    home.starters,
                    players,
                    requestedWeek
                );

            const awayProjection =
                getProjection(
                    away.starters,
                    players,
                    requestedWeek
                );

            const margin =
                Math.abs(
                    homeProjection -
                    awayProjection
                );

            const total =
                Number(homeProjection) +
                Number(awayProjection);

            const favorite =
                homeProjection > awayProjection
                    ? homeTeam
                    : awayProjection > homeProjection
                    ? awayTeam
                    : null;

            const underdog =
                homeProjection > awayProjection
                    ? awayTeam
                    : awayProjection > homeProjection
                    ? homeTeam
                    : null;

            const homeTopPlayers =
                getTopProjectedPlayers(
                    home.starters,
                    players,
                    requestedWeek
                );

            const awayTopPlayers =
                getTopProjectedPlayers(
                    away.starters,
                    players,
                    requestedWeek
                );

            const commentary =
                editorial?.matchups?.[matchupID] || null;

            games.push({
                matchupID,
                home,
                away,
                homeTeam,
                awayTeam,
                homeProjection,
                awayProjection,
                homeTopPlayers,
                awayTopPlayers,
                homeAvatar: getTeamAvatar(homeTeam),
                awayAvatar: getTeamAvatar(awayTeam),
                margin: Number(round(margin)),
                total: Number(round(total)),
                favorite,
                underdog,
                commentary
            });
        }

        const sortedByMargin =
            [...games].sort(
                (a, b) => a.margin - b.margin
            );

        const sortedByTotal =
            [...games].sort(
                (a, b) => b.total - a.total
            );

        return {
            week: requestedWeek,
            intro: editorial?.intro || null,
            games,
            gameOfWeek:
                sortedByMargin[0] || null,
            blowout:
                sortedByMargin[
                    sortedByMargin.length - 1
                ] || null,
            shootout:
                sortedByTotal[0] || null
        };
    };

    Promise.all([
        data.matchupsData,
        data.leagueTeamManagersData,
        data.playersData
    ]).then(
        ([
            matchupsData,
            leagueTeamManagers,
            playersData
        ]) => {
            previewData = buildPreview(
                matchupsData,
                leagueTeamManagers,
                playersData
            );

            loading = false;
        }
    );
</script>

<svelte:head>
    <title>
        Weekly Preview | TouchDown Syndrome
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
        line-height: 1.65em;
        text-align: center;
        color: var(--g555);
    }

    .featureGrid {
        display: grid;
        grid-template-columns:
            repeat(3, minmax(0, 1fr));
        gap: 1em;
        margin-bottom: 3em;
    }

    .feature {
        border: 1px solid var(--ccc);
        border-radius: 1em;
        padding: 1.25em;
        text-align: center;
        background: var(--fff);
        box-shadow: 0 0 6px 0 var(--bbb);
    }

    .featureLabel {
        font-size: 0.75em;
        font-weight: 700;
        letter-spacing: 0.1em;
        color: #888;
        margin-bottom: 0.6em;
    }

    .featureTeams {
        font-weight: 700;
        line-height: 1.3em;
    }

    .featureStat {
        margin-top: 0.6em;
        font-size: 0.9em;
        color: #666;
    }

    .game {
        border: 1px solid var(--ccc);
        border-radius: 1em;
        margin: 1.5em 0;
        overflow: hidden;
        box-shadow: 0 0 6px 0 var(--bbb);
        background: var(--fff);
    }

    .matchupHeader {
        display: grid;
        grid-template-columns:
            1fr auto 1fr;
        align-items: center;
        padding: 1.5em;
        gap: 1em;
    }

    .team {
        text-align: center;
    }

    .teamIdentity {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 0.7em;
        min-height: 54px;
    }

    .teamAvatar {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        object-fit: cover;
        border: 1px solid var(--ccc);
    }

    .teamName {
        font-weight: 700;
        line-height: 1.2em;
    }

    .projection {
        font-size: 2em;
        font-weight: 700;
        margin-top: 0.35em;
    }

    .vs {
        color: #999;
        font-weight: 700;
        padding: 0 1em;
    }

    .line {
        text-align: center;
        background: var(--eee);
        padding: 0.75em;
        font-size: 0.9em;
    }

    .keyPlayers {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1em;
        padding: 1.2em 1.5em;
        border-top: 1px solid var(--ccc);
        border-bottom: 1px solid var(--ccc);
    }

    .playerSide {
        min-width: 0;
    }

    .playerSideTitle {
        font-size: 0.75em;
        font-weight: 700;
        letter-spacing: 0.08em;
        color: #888;
        margin-bottom: 0.6em;
    }

    .playerRow {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 0.75em;
        align-items: center;
        padding: 0.35em 0;
    }

    .playerName {
        font-weight: 600;
        color: var(--g555);
    }

    .playerMeta {
        display: block;
        font-size: 0.75em;
        color: #888;
        margin-top: 0.1em;
    }

    .playerProjection {
        font-weight: 700;
        color: var(--g555);
        white-space: nowrap;
    }

    .previewCopy {
        padding: 1.4em 1.6em 1.6em;
    }

    .czarTitle {
        font-size: 0.75em;
        font-weight: 700;
        letter-spacing: 0.1em;
        color: #888;
        margin-bottom: 0.5em;
    }

    .commentaryHeadline {
        margin: 0 0 0.75em;
        font-size: 1.25em;
    }

    .commentaryText {
        margin: 0;
        line-height: 1.65em;
        color: var(--g555);
    }

    .pick {
        margin-top: 1.25em;
        font-size: 0.95em;
    }

    .pickLabel {
        font-weight: 700;
    }

    .placeholder {
        color: #888;
        font-style: italic;
    }

    .loading,
    .noGames {
        text-align: center;
        padding: 5em 0;
        color: #888;
    }

    @media (max-width: 700px) {
        .featureGrid {
            grid-template-columns: 1fr;
        }

        .matchupHeader {
            padding: 1.1em;
        }

        .projection {
            font-size: 1.6em;
        }

        .vs {
            padding: 0 0.4em;
        }

        .title {
            font-size: 2.2em;
        }

        .intro {
            text-align: left;
        }

        .keyPlayers {
            grid-template-columns: 1fr;
        }

        .teamIdentity {
            flex-direction: column;
        }

        .teamAvatar {
            width: 40px;
            height: 40px;
        }
    }
</style>

<div class="page">

    {#if loading}
        <div class="loading">
            Building weekly preview...
        </div>

    {:else if previewData}

        <h1 class="title">
            Week {previewData.week} Preview
        </h1>

        <div class="subtitle">
            The official word from the Roster Czar
        </div>

        {#if previewData.intro}
            <div class="intro">
                {previewData.intro}
            </div>
        {/if}

        {#if previewData.games.length > 0}

            <div class="featureGrid">

                {#if previewData.gameOfWeek}
                    <div class="feature">
                        <div class="featureLabel">
                            GAME OF THE WEEK
                        </div>

                        <div class="featureTeams">
                            {previewData.gameOfWeek.homeTeam.name}
                            vs
                            {previewData.gameOfWeek.awayTeam.name}
                        </div>

                        <div class="featureStat">
                            Projected margin:
                            {previewData.gameOfWeek.margin}
                        </div>
                    </div>
                {/if}

                {#if previewData.shootout}
                    <div class="feature">
                        <div class="featureLabel">
                            PROJECTED SHOOTOUT
                        </div>

                        <div class="featureTeams">
                            {previewData.shootout.homeTeam.name}
                            vs
                            {previewData.shootout.awayTeam.name}
                        </div>

                        <div class="featureStat">
                            Projected total:
                            {previewData.shootout.total}
                        </div>
                    </div>
                {/if}

                {#if previewData.blowout}
                    <div class="feature">
                        <div class="featureLabel">
                            ASS BEATING OF THE WEEK
                        </div>

                        <div class="featureTeams">
                            {previewData.blowout.favorite?.name}
                            over
                            {previewData.blowout.underdog?.name}
                        </div>

                        <div class="featureStat">
                            Projected margin:
                            {previewData.blowout.margin}
                        </div>
                    </div>
                {/if}

            </div>

            {#each previewData.games as game}

                <div class="game">

                    <div class="matchupHeader">

                        <div class="team">

                            <div class="teamIdentity">
                                {#if game.homeAvatar}
                                    <img
                                        class="teamAvatar"
                                        src={game.homeAvatar}
                                        alt={game.homeTeam.name}
                                    />
                                {/if}

                                <div class="teamName">
                                    {game.homeTeam.name}
                                </div>
                            </div>

                            <div class="projection">
                                {game.homeProjection}
                            </div>

                        </div>

                        <div class="vs">
                            VS
                        </div>

                        <div class="team">

                            <div class="teamIdentity">
                                {#if game.awayAvatar}
                                    <img
                                        class="teamAvatar"
                                        src={game.awayAvatar}
                                        alt={game.awayTeam.name}
                                    />
                                {/if}

                                <div class="teamName">
                                    {game.awayTeam.name}
                                </div>
                            </div>

                            <div class="projection">
                                {game.awayProjection}
                            </div>

                        </div>

                    </div>

                    <div class="line">
                        {#if game.favorite}
                            Projected Line:
                            {game.favorite.name}
                            -{game.margin}
                            &nbsp; | &nbsp;
                        {/if}

                        Projected Total:
                        {game.total}
                    </div>

                    <div class="keyPlayers">

                        <div class="playerSide">
                            <div class="playerSideTitle">
                                {game.homeTeam.name} — KEY PLAYERS
                            </div>

                            {#each game.homeTopPlayers as player}
                                <div class="playerRow">
                                    <div>
                                        <span class="playerName">
                                            {player.name}
                                        </span>

                                        <span class="playerMeta">
                                            {player.position}
                                            {#if player.nflTeam}
                                                · {player.nflTeam}
                                            {/if}
                                        </span>
                                    </div>

                                    <div class="playerProjection">
                                        {player.projection}
                                    </div>
                                </div>
                            {/each}
                        </div>

                        <div class="playerSide">
                            <div class="playerSideTitle">
                                {game.awayTeam.name} — KEY PLAYERS
                            </div>

                            {#each game.awayTopPlayers as player}
                                <div class="playerRow">
                                    <div>
                                        <span class="playerName">
                                            {player.name}
                                        </span>

                                        <span class="playerMeta">
                                            {player.position}
                                            {#if player.nflTeam}
                                                · {player.nflTeam}
                                            {/if}
                                        </span>
                                    </div>

                                    <div class="playerProjection">
                                        {player.projection}
                                    </div>
                                </div>
                            {/each}
                        </div>

                    </div>

                    <div class="previewCopy">

                        <div class="czarTitle">
                            THE CZAR'S READ
                        </div>

                        {#if game.commentary}

                            {#if game.commentary.headline}
                                <h3 class="commentaryHeadline">
                                    {game.commentary.headline}
                                </h3>
                            {/if}

                            {#if game.commentary.preview}
                                <p class="commentaryText">
                                    {game.commentary.preview}
                                </p>
                            {/if}

                            {#if game.commentary.pick}
                                <div class="pick">
                                    <span class="pickLabel">
                                        CZAR PICK:
                                    </span>

                                    {game.commentary.pick}
                                </div>
                            {/if}

                        {:else}

                            <div class="placeholder">
                                No Czar commentary yet.
                            </div>

                        {/if}

                    </div>

                </div>

            {/each}

        {:else}

            <div class="noGames">
                No matchups found for Week
                {previewData.week}.
            </div>

        {/if}

    {/if}

</div>
