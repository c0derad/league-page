<script>
    export let data;
</script>

<svelte:head>
    <title>
        Power Rankings Data
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
    >{JSON.stringify(
        data.powerRankingsData,
        null,
        2
    )}</pre>
</div>
