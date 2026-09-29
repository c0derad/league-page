<script>
    export let data;
</script>

<svelte:head>
    <title>
        Week {data.recapExport.week} Recap Export
    </title>
</svelte:head>

<div class="page">

    <h1>
        Week {data.recapExport.week} Recap Export
    </h1>

    <p>
        Temporary internal recap data export.
    </p>

    <pre>
{JSON.stringify(
    data.recapExport,
    null,
    2
)}
    </pre>

</div>

<style>
    .page {
        width: 96%;
        max-width: 1200px;
        margin: 2em auto 5em;
    }

    pre {
        padding: 1.5em;
        border: 1px solid var(--ccc);
        border-radius: 0.75em;
        overflow-x: auto;
        white-space: pre-wrap;
        word-break: break-word;
        font-size: 0.8em;
        line-height: 1.45;
    }
</style>
