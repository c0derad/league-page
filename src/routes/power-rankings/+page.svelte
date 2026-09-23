<script>
    export let data;

    const changeWeek = (
        event
    ) => {
        const week =
            Number(
                event.currentTarget.value
            );

        window.location.href =
            `/power-rankings?week=${week}`;
    };

    const getMovementText = (
        movement
    ) => {
        if (movement > 0) {
            return `▲ ${movement}`;
        }

        if (movement < 0) {
            return `▼ ${Math.abs(movement)}`;
        }

        return '—';
    };
</script>

<svelte:head>
    <title>
        Power Rankings
    </title>
</svelte:head>

<div class="page">

    <div class="header">

        <div class="eyebrow">
            THE CZAR PRESENTS
        </div>

        <h1>
            {data.rankingData.title}
        </h1>

        <div class="weekSelector">

            <label
                for="week-select"
            >
                WEEK
            </label>

            <select
                id="week-select"
                value={data.week}
                on:change={changeWeek}
            >
                {#each data.availableWeeks as week}
                    <option
                        value={week}
                    >
                        Week {week}
                    </option>
                {/each}
            </select>

        </div>

    </div>

    <div class="intro">
        {data.rankingData.intro}
    </div>

    <div class="rankings">

        {#each data.rankingData.rankings as team}

            <article
                class:jailed={team.status}
                class="rankingCard"
            >

                <div class="rankColumn">

                    <div class="rankLabel">
                        RANK
                    </div>

                    <div class="rankNumber">
                        {team.rank}
                    </div>

                    {#if team.movement !== undefined}

                        <div
                            class:movementUp={team.movement > 0}
                            class:movementDown={team.movement < 0}
                            class:movementSame={team.movement === 0}
                            class="movement"
                        >
                            {getMovementText(
                                team.movement
                            )}
                        </div>

                    {/if}

                </div>

                <div class="content">

                    <div class="teamHeader">

                        <div>

                            <h2>
                                {team.team}
                            </h2>

                            <div class="record">
                                {team.record}
                            </div>

                        </div>

                        {#if team.status}
                            <div class="status">
                                {team.status}
                            </div>
                        {/if}

                    </div>

                    <div class="metrics">

                        {#if team.week1Score !== undefined}
                            <div class="metric">
                                <span class="metricLabel">
                                    WEEK 1
                                </span>

                                <span class="metricValue">
                                    {team.week1Score}
                                </span>
                            </div>
                        {/if}

                        {#if team.week2Score !== undefined}
                            <div class="metric">
                                <span class="metricLabel">
                                    WEEK 2
                                </span>

                                <span class="metricValue">
                                    {team.week2Score}
                                </span>
                            </div>
                        {/if}

                        {#if team.week3Projection !== undefined}
                            <div class="metric">
                                <span class="metricLabel">
                                    WEEK 3 PROJ.
                                </span>

                                <span class="metricValue">
                                    {team.week3Projection}
                                </span>
                            </div>
                        {:else if team.week2Projection !== undefined}
                            <div class="metric">
                                <span class="metricLabel">
                                    WEEK 2 PROJ.
                                </span>

                                <span class="metricValue">
                                    {team.week2Projection}
                                </span>
                            </div>
                        {/if}

                    </div>

                    <h3>
                        {team.headline}
                    </h3>

                    <div class="commentary">
                        {team.commentary}
                    </div>

                    <div class="transactions">

                        <span class="transactionsLabel">
                            TRANSACTIONS
                        </span>

                        <span>
                            {team.transactions}
                        </span>

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
        padding: 2.5em 0 5em;
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
        font-size: clamp(
            2em,
            5vw,
            3.5em
        );
        line-height: 1;
    }

    .weekSelector {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 0.7em;
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

    .weekSelector select option {
        background: var(--fff);
        color: var(--000);
    }

    .intro {
        white-space: pre-line;
        line-height: 1.7;
        max-width: 850px;
        margin: 0 auto 3em;
        padding: 1.4em 1.6em;
        border: 1px solid var(--ccc);
        border-radius: 0.8em;
    }

    .rankings {
        display: flex;
        flex-direction: column;
        gap: 1.4em;
    }

    .rankingCard {
        display: grid;
        grid-template-columns:
            100px minmax(0, 1fr);
        border: 1px solid var(--ccc);
        border-radius: 0.8em;
        overflow: hidden;
    }

    .rankColumn {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-start;
        padding: 1.5em 0.8em;
        border-right:
            1px solid var(--ccc);
    }

    .rankLabel {
        margin-bottom: 0.25em;
        font-size: 0.62em;
        font-weight: 800;
        letter-spacing: 0.12em;
        color: #888;
    }

    .rankNumber {
        font-size: 2.7em;
        font-weight: 900;
        line-height: 1;
    }

    .movement {
        margin-top: 0.55em;
        padding: 0.25em 0.45em;
        border-radius: 999px;
        font-size: 0.78em;
        font-weight: 900;
        line-height: 1;
    }

    .movementUp {
        color: #22c55e;
        background:
            rgba(
                34,
                197,
                94,
                0.12
            );
    }

    .movementDown {
        color: #ef4444;
        background:
            rgba(
                239,
                68,
                68,
                0.12
            );
    }

    .movementSame {
        color: #888;
        background:
            rgba(
                136,
                136,
                136,
                0.10
            );
    }

    .content {
        padding: 1.5em;
    }

    .teamHeader {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 1em;
    }

    .teamHeader h2 {
        margin: 0;
        font-size: 1.55em;
    }

    .record {
        margin-top: 0.25em;
        font-size: 0.85em;
        font-weight: 700;
        color: #888;
    }

    .status {
        padding: 0.45em 0.7em;
        border: 1px solid var(--ccc);
        border-radius: 999px;
        font-size: 0.7em;
        font-weight: 900;
        letter-spacing: 0.06em;
        white-space: nowrap;
    }

    .metrics {
        display: grid;
        grid-template-columns:
            repeat(
                3,
                minmax(0, max-content)
            );
        gap: 2.3em;
        margin: 1.1em 0 1.3em;
    }

    .metric {
        display: flex;
        flex-direction: column;
    }

    .metricLabel {
        margin-bottom: 0.15em;
        font-size: 0.62em;
        font-weight: 800;
        letter-spacing: 0.08em;
        color: #888;
    }

    .metricValue {
        font-size: 1.1em;
        font-weight: 800;
    }

    h3 {
        margin:
            0 0 0.7em;
        font-size: 1.15em;
    }

    .commentary {
        white-space: pre-line;
        line-height: 1.65;
    }

    .transactions {
        margin-top: 1.25em;
        padding-top: 1em;
        border-top:
            1px solid var(--ccc);
        line-height: 1.5;
        font-size: 0.9em;
    }

    .transactionsLabel {
        display: block;
        margin-bottom: 0.35em;
        font-size: 0.68em;
        font-weight: 900;
        letter-spacing: 0.08em;
        color: #888;
    }

    .jailed {
        border-width: 2px;
    }

    @media (
        max-width: 650px
    ) {
        .page {
            width: 96%;
        }

        .rankingCard {
            grid-template-columns:
                68px minmax(0, 1fr);
        }

        .rankNumber {
            font-size: 2em;
        }

        .rankColumn {
            padding:
                1.3em 0.4em;
        }

        .movement {
            font-size: 0.68em;
        }

        .content {
            padding: 1.2em;
        }

        .teamHeader {
            flex-direction: column;
        }

        .status {
            margin-top: 0.25em;
        }

        .metrics {
            grid-template-columns:
                repeat(
                    2,
                    minmax(0, 1fr)
                );
            gap: 1em 1.5em;
        }
    }
</style>
