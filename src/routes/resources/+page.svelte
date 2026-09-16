<script>
    export let data;
</script>

<svelte:head>
    <title>Roster Debug</title>
</svelte:head>

<div
    style="
        width: 95%;
        max-width: 1200px;
        margin: 2em auto;
    "
>
    <h1>Roster Debug</h1>

    <pre
        style="
            white-space: pre-wrap;
            word-break: break-word;
            padding: 1em;
            border: 1px solid var(--ccc);
            border-radius: 0.5em;
        "
    >{JSON.stringify(data, null, 2)}</pre>
</div>
