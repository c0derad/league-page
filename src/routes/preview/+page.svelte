<script>
    import {
        getTeamFromTeamManagers,
        round
    } from '$lib/utils/helperFunctions/universalFunctions';

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
                player.wi &&
                player.wi[week] &&
                player.wi[week].p
                    ? parseFloat(player.wi[week].p)
                    : 0;

            total += projection;
        }

        return Number(round(total));;
    };

    const buildPreview = (
        matchupsData,
        leagueTeamManagers,
        playersData
    ) => {
        const players = playersData.players;

        const requestedWeek =
            data.queryWeek ||
            matchupsData.week ||
            1;

        const matchupWeek =
            matchupsData.matchupWeeks.find(
                (m) => m.week == requestedWeek
            );

        if (!matchupWeek) {
            return {
                week: requestedWeek,
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

            games.push({
                matchupID,
                home,
                away,
                homeTeam,
                awayTeam,
                homeProjection,
                awayProjection,
                margin: round(margin),
                total: round(total),
                favorite,
                underdog
            });
        }

        const sortedByMargin = [...games].sort(
            (a, b) => a.margin - b.margin
        );

        const sortedByTotal = [...games].sort(
            (a, b) => b.total - a.total
        );

        return {
            week: requestedWeek,
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
        max-width: 950px;
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
        margin-bottom: 3em;
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
        margin: 1.25em 0;
        overflow: hidden;
        box-shadow: 0 0 6px 0 var(--bbb);
        background: var(--fff);
    }

    .matchupHeader {
        display: grid;
        grid-template-columns: 1fr auto 1fr;
        align-items: center;
        padding: 1.5em;
    }

    .team {
        text-align: center;
    }

    .teamName {
        font-weight: 700;
        line-height: 1.2em;
    }

    .projection {
        font-size: 2em;
        font-weight: 700;
        margin-top: 0.25em;
    }

    .vs {
        color: #999;
        font-weight: 700;
        padding: 0 1.5em;
    }

    .line {
        text-align: center;
        background: var(--eee);
        padding: 0.75em;
        font-size: 0.9em;
    }

    .previewCopy {
        padding: 1.25em 1.5em 1.5em;
    }

    .czarTitle {
        font-size: 0.75em;
        font-weight: 700;
        letter-spacing: 0.1em;
        color: #888;
        margin-bottom: 0.5em;
    }

    .placeholder {
        color: #888;
        font-style: italic;
    }

    .loading {
        text-align: center;
        padding: 6em 0;
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
            padding: 0 0.75em;
        }

        .title {
            font-size: 2.2em;
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
                        <div class="teamName">
                            {game.homeTeam.name}
                        </div>

                        <div class="projection">
                            {game.homeProjection}
                        </div>
                    </div>

                    <div class="vs">
                        VS
                    </div>

                    <div class="team">
                        <div class="teamName">
                            {game.awayTeam.name}
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

                <div class="previewCopy">
                    <div class="czarTitle">
                        THE CZAR'S READ
                    </div>

                    <div class="placeholder">
                        Weekly matchup commentary goes here.
                    </div>
                </div>

            </div>

        {/each}

    {/if}

</div>
