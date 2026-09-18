<script>
    import {
        onMount
    } from 'svelte';

    import {
        collegeLogo,
        collegeLogoFallback
    } from '$lib/utils/collegeLogos';

    export let data;

    let bets =
        data.bestBetsData.bets.map(
            (bet) => ({
                ...bet,
                opponent: 'Loading...',
                opponentSlug: null
            })
        );

    const normalize = (value) =>
        String(value || '')
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '');

    const teamAliases = {
        'southerncalifornia': [
            'southerncalifornia',
            'usc'
        ],

        'jamesmadison': [
            'jamesmadison',
            'jmu'
        ],

        'louisianatech': [
            'louisianatech',
            'latech'
        ]
    };

    const matchesTeam = (
        bet,
        espnTeam
    ) => {
        const betValues = [
            normalize(bet.team),
            normalize(bet.teamSlug)
        ];

        const espnValues = [
            normalize(
                espnTeam?.displayName
            ),
            normalize(
                espnTeam?.shortDisplayName
            ),
            normalize(
                espnTeam?.name
            ),
            normalize(
                espnTeam?.abbreviation
            ),
            normalize(
                espnTeam?.location
            )
        ].filter(Boolean);

        const aliases =
            teamAliases[
                normalize(bet.team)
            ] || [];

        const searchValues = [
            ...betValues,
            ...aliases
        ].filter(Boolean);

        return searchValues.some(
            (value) =>
                espnValues.includes(value)
        );
    };

    const getSlugFromTeamName = (
        teamName
    ) => {
        return String(teamName || '')
            .trim()
            .toLowerCase()
            .replace(/&/g, 'and')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    };

    const enrichBet = (
        bet,
        events
    ) => {
        for (const event of events) {
            const competitors =
                event?.competitions?.[0]
                    ?.competitors || [];

            if (
                competitors.length < 2
            ) {
                continue;
            }

            const selected =
                competitors.find(
                    (competitor) =>
                        matchesTeam(
                            bet,
                            competitor.team
                        )
                );

            if (!selected) {
                continue;
            }

            const opponent =
                competitors.find(
                    (competitor) =>
                        competitor !== selected
                );

            if (!opponent?.team) {
                continue;
            }

            const opponentName =
                opponent.team
                    .shortDisplayName ||
                opponent.team
                    .displayName ||
                opponent.team.name;

            return {
                ...bet,

                opponent:
                    opponentName,

                opponentSlug:
                    getSlugFromTeamName(
                        opponentName
                    ),

                matchupFound:
                    true,

                espnOpponentLogo:
                    opponent.team.logo ||
                    null
            };
        }

        return {
            ...bet,
            opponent: 'Opponent TBD',
            opponentSlug: null,
            matchupFound: false,
            espnOpponentLogo: null
        };
    };

    const loadMatchups =
        async () => {
            const year =
                data.bestBetsData.year ||
                2026;

            const week =
                data.bestBetsData.ncaaWeek ||
                data.week;

            try {
                const url =
                    `https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard` +
                    `?dates=${year}` +
                    `&seasontype=2` +
                    `&week=${week}` +
                    `&limit=100`;

                const response =
                    await fetch(url);

                if (!response.ok) {
                    throw new Error(
                        `ESPN returned ${response.status}`
                    );
                }

                const scoreboard =
                    await response.json();

                const events =
                    Array.isArray(
                        scoreboard?.events
                    )
                        ? scoreboard.events
                        : [];

                bets =
                    data.bestBetsData.bets.map(
                        (bet) =>
                            enrichBet(
                                bet,
                                events
                            )
                    );

            } catch (error) {
                console.error(
                    'Failed to load ESPN matchups',
                    error
                );

                bets =
                    data.bestBetsData.bets.map(
                        (bet) => ({
                            ...bet,
                            opponent:
                                'Opponent TBD',
                            opponentSlug:
                                null,
                            matchupFound:
                                false,
                            espnOpponentLogo:
                                null
                        })
                    );
            }
        };

    const changeWeek = (event) => {
        const week =
            Number(
                event.currentTarget.value
            );

        window.location.href =
            `/best-bets?week=${week}`;
    };

    const handleLogoError = (
        event,
        slug
    ) => {
        const fallback =
            collegeLogoFallback(
                slug
            );

        if (
            fallback &&
            event.currentTarget.src !==
                fallback
        ) {
            event.currentTarget.src =
                fallback;

            return;
        }

        event.currentTarget.style.display =
            'none';
    };

    onMount(() => {
        loadMatchups();
    });
</script>

<svelte:head>
    <title>
        Best Bets | TouchDown Syndrome
    </title>
</svelte:head>

<div class="page">

    <div class="header">
        <div class="eyebrow">
            THE CZAR PRESENTS
        </div>

        <h1>
            {data.bestBetsData.title}
        </h1>

        <div class="weekSelector">

            <label for="week-select">
                WEEK
            </label>

            <select
                id="week-select"
                value={data.week}
                on:change={changeWeek}
            >
                {#each data.availableWeeks as week}
                    <option value={week}>
                        Week {week}
                    </option>
                {/each}
            </select>

        </div>
    </div>

    <div class="intro">
        {data.bestBetsData.intro}
    </div>

    <div class="bets">

        {#each bets as bet}

            <article class="betCard">

                <div class="rankColumn">
                    <div class="rankLabel">
                        BET
                    </div>

                    <div class="rankNumber">
                        {bet.rank}
                    </div>
                </div>

                <div class="content">

                    <div class="matchupRow">

                        <div class="teamBlock">

                            {#if bet.teamSlug}
                                <img
                                    class="logo"
                                    src={collegeLogo(
                                        bet.teamSlug
                                    )}
                                    alt={`${bet.team} logo`}
                                    on:error={(event) =>
                                        handleLogoError(
                                            event,
                                            bet.teamSlug
                                        )
                                    }
                                />
                            {/if}

                            <div>
                                <div class="teamName">
                                    {bet.team}
                                </div>
                            
                                <div
                                    style="
                                        font-size: 0.65em;
                                        color: #888;
                                        word-break: break-all;
                                    "
                                >
                                    {collegeLogo(bet.teamSlug)}
                                </div>
                            
                        </div>

                        <div class="vsBlock">
                            vs
                        </div>

                        <div class="teamBlock">

                            {#if bet.espnOpponentLogo}
                                <img
                                    class="logo"
                                    src={bet.espnOpponentLogo}
                                    alt={`${bet.opponent} logo`}
                                />
                            {:else if bet.opponentSlug}
                                <img
                                    class="logo"
                                    src={collegeLogo(
                                        bet.opponentSlug
                                    )}
                                    alt={`${bet.opponent} logo`}
                                    on:error={(event) =>
                                        handleLogoError(
                                            event,
                                            bet.opponentSlug
                                        )
                                    }
                                />
                            {/if}

                            <div class="teamName">
                                {bet.opponent}
                            </div>

                        </div>

                    </div>

                    <div class="pickRow">
                        <div class="pickLabel">
                            BEST BET
                        </div>

                        <div class="pickValue">
                            {bet.pick}
                        </div>
                    </div>

                    <div class="commentary">
                        {bet.commentary}
                    </div>

                </div>

            </article>

        {/each}

    </div>

</div>

<style>
    .page {
        width: 94%;
        max-width: 1050px;
        margin: 0 auto;
        padding: 3em 0 6em;
    }

    .header {
        text-align: center;
        margin-bottom: 2em;
    }

    .eyebrow {
        margin-bottom: 0.6em;
        font-size: 0.72em;
        font-weight: 800;
        letter-spacing: 0.14em;
        color: #888;
    }

    h1 {
        margin: 0 0 0.9em;
        font-size: 2.8em;
    }

    .weekSelector {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 0.7em;
        margin: 0 auto 2.5em;
    }

    .weekSelector label {
        font-size: 0.72em;
        font-weight: 700;
        letter-spacing: 0.08em;
        color: #888;
    }

    .weekSelector select {
        padding: 0.55em 0.8em;
        border: 1px solid var(--ccc);
        border-radius: 0.5em;
        background: var(--fff);
        color: var(--000);
        font: inherit;
        font-weight: 600;
        cursor: pointer;
    }

    .intro {
        max-width: 820px;
        margin: 0 auto 3em;
        text-align: center;
        white-space: pre-line;
        line-height: 1.65em;
    }

    .bets {
        display: flex;
        flex-direction: column;
        gap: 1.5em;
    }

    .betCard {
        display: grid;
        grid-template-columns:
            90px minmax(0, 1fr);

        border: 1px solid var(--ccc);
        border-radius: 0.8em;
        overflow: hidden;
    }

    .rankColumn {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 1.5em 0.8em;
        border-right: 1px solid var(--ccc);
    }

    .rankLabel {
        font-size: 0.62em;
        font-weight: 800;
        letter-spacing: 0.12em;
        color: #888;
    }

    .rankNumber {
        margin-top: 0.2em;
        font-size: 2.5em;
        font-weight: 900;
    }

    .content {
        padding: 1.5em;
    }

    .matchupRow {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 1.25em;
        margin-bottom: 1.4em;
        flex-wrap: wrap;
    }

    .teamBlock {
        display: flex;
        align-items: center;
        gap: 0.7em;
    }

    .logo {
        width: 52px;
        height: 52px;
        object-fit: contain;
    }

    .teamName {
        font-size: 1.05em;
        font-weight: 800;
    }

    .vsBlock {
        color: #888;
        font-weight: 800;
    }

    .pickRow {
        margin-bottom: 1em;
    }

    .pickLabel {
        margin-bottom: 0.2em;
        font-size: 0.68em;
        font-weight: 800;
        letter-spacing: 0.09em;
        color: #888;
    }

    .pickValue {
        font-size: 1.4em;
        font-weight: 900;
    }

    .commentary {
        white-space: pre-line;
        line-height: 1.65em;
    }

    @media (max-width: 650px) {
        .betCard {
            grid-template-columns:
                62px minmax(0, 1fr);
        }

        .rankNumber {
            font-size: 2em;
        }

        .logo {
            width: 40px;
            height: 40px;
        }

        h1 {
            font-size: 2.2em;
        }
    }
</style>
