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
                opponentSlug: null,
                espnTeamLogo: null,
                espnOpponentLogo: null
            })
        );

    const normalize = (value) =>
        String(value || '')
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '');

    const teamAliases = {
        southerncalifornia: [
            'southerncalifornia',
            'usc'
        ],

        jamesmadison: [
            'jamesmadison',
            'jmu'
        ],

        louisianatech: [
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
            const competition =
                event?.competitions?.[0];

            const competitors =
                competition?.competitors || [];

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

            const matchupSeparator =
                selected.homeAway === 'away'
                    ? '@'
                    : 'vs';

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

                matchupSeparator,

                espnTeamLogo:
                    selected.team.logo ||
                    null,

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
            matchupSeparator: 'vs',
            espnTeamLogo: null,
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
                    `&groups=80` +
                    `&limit=200`;

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
                            matchupSeparator:
                                'vs',
                            espnTeamLogo:
                                null,
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

                    <div class="matchup">

                        <div class="team">

                            {#if bet.espnTeamLogo}
                                <img
                                    class="logo"
                                    src={bet.espnTeamLogo}
                                    alt={`${bet.team} logo`}
                                />
                            {:else if bet.teamSlug}
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

                            <div class="teamName">
                                {bet.team}
                            </div>

                        </div>

                        <div class="separator">
                            {bet.matchupSeparator || 'vs'}
                        </div>

                        <div class="team opponent">

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

                    <div class="betSection">

                        <div class="pickLabel">
                            THE PLAY
                        </div>

                        <div class="pickValue">
                            {bet.pick}
                        </div>

                    </div>

                    <div class="divider"></div>

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
        max-width: 1000px;
        margin: 0 auto;
        padding: 3em 0 6em;
    }

    .header {
        text-align: center;
        margin-bottom: 2em;
    }

    .eyebrow {
        margin-bottom: 0.7em;
        font-size: 0.72em;
        font-weight: 800;
        letter-spacing: 0.14em;
        color: #888;
    }

    h1 {
        margin: 0 0 1em;
        font-size: 2.8em;
    }

    .weekSelector {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 0.7em;
        margin-bottom: 2.5em;
    }

    .weekSelector label {
        font-size: 0.72em;
        font-weight: 800;
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
        font-weight: 700;
        cursor: pointer;
    }

    .intro {
        max-width: 760px;
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
            84px minmax(0, 1fr);

        border: 1px solid var(--ccc);
        border-radius: 0.9em;
        overflow: hidden;
    }

    .rankColumn {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 1.6em 0.7em;
        border-right: 1px solid var(--ccc);
    }

    .rankLabel {
        font-size: 0.6em;
        font-weight: 800;
        letter-spacing: 0.12em;
        color: #888;
    }

    .rankNumber {
        margin-top: 0.2em;
        font-size: 2.5em;
        font-weight: 900;
        line-height: 1;
    }

    .content {
        min-width: 0;
        padding: 1.6em 1.8em 1.8em;
    }

    .matchup {
        display: flex;
        align-items: center;
        justify-content: flex-start;
        gap: 1em;
        flex-wrap: wrap;
    }

    .team {
        display: flex;
        align-items: center;
        gap: 0.7em;
        min-width: 0;
    }

    .logo {
        width: 48px;
        height: 48px;
        object-fit: contain;
        flex: 0 0 auto;
    }

    .teamName {
        font-size: 1.05em;
        font-weight: 800;
    }

    .separator {
        color: #888;
        font-size: 0.8em;
        font-weight: 900;
        text-transform: uppercase;
    }

    .betSection {
        margin-top: 1.3em;
    }

    .pickLabel {
        margin-bottom: 0.25em;
        font-size: 0.65em;
        font-weight: 900;
        letter-spacing: 0.12em;
        color: #888;
    }

    .pickValue {
        font-size: 1.55em;
        font-weight: 900;
        line-height: 1.15;
    }

    .divider {
        height: 1px;
        margin: 1.3em 0 1.15em;
        background: var(--ccc);
    }

    .commentary {
        max-width: 760px;
        white-space: pre-line;
        line-height: 1.65em;
    }

    @media (max-width: 650px) {

        .page {
            width: 95%;
        }

        .betCard {
            grid-template-columns:
                58px minmax(0, 1fr);
        }

        .rankColumn {
            padding:
                1.3em 0.35em;
        }

        .rankNumber {
            font-size: 1.9em;
        }

        .content {
            padding:
                1.25em 1.1em 1.4em;
        }

        .matchup {
            gap: 0.7em;
        }

        .logo {
            width: 38px;
            height: 38px;
        }

        .teamName {
            font-size: 0.92em;
        }

        .separator {
            font-size: 0.7em;
        }

        .pickValue {
            font-size: 1.35em;
        }

        h1 {
            font-size: 2.2em;
        }
    }
</style>
