<script>
    export let data;

    let output = null;
    let loading = true;

    Promise.all([
        data.matchupsData,
        data.leagueTeamManagersData,
        data.playersData
    ]).then(([
        matchupsData,
        leagueTeamManagers,
        playersData
    ]) => {

        const week =
            2;

        const rawMatchups =
            matchupsData?.matchups?.[week] ||
            matchupsData?.[week] ||
            matchupsData;

        output = {
            week,
            rawMatchups,
            leagueTeamManagers,
            playersData
        };

        loading = false;
    });
</script>

<svelte:head>
    <title>
        Week 2 Recap Export
    </title>
</svelte:head>

<div
    style="
        width: 95%;
        max-width: 1400px;
        margin: 2em auto;
    "
>
    <h1>
        Week 2 Recap Export
    </h1>

    {#if loading}
        <p>
            Loading...
        </p>
    {:else}
        <pre
            style="
                white-space: pre-wrap;
                word-break: break-word;
                padding: 1em;
                border: 1px solid var(--ccc);
                border-radius: 0.5em;
                font-size: 0.72em;
                overflow-x: auto;
            "
        >{JSON.stringify(
            output,
            null,
            2
        )}</pre>
    {/if}
</div>
