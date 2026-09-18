<script>
    export let data;
</script>

<svelte:head>
    <title>
        NCAA Week 3 Debug
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
        NCAA Week 3 Debug
    </h1>

    <pre
        style="
            white-space: pre-wrap;
            word-break: break-word;
            padding: 1em;
            border: 1px solid var(--ccc);
            border-radius: 0.5em;
            font-size: 0.75em;
            overflow-x: auto;
        "
    >{JSON.stringify(
        data.debugData,
        null,
        2
    )}</pre>
</div>
