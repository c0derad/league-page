<script>
    import { page } from '$app/stores';
</script>

<svelte:head>
    <title>CFB Model — Unable to Load</title>
</svelte:head>

<section class="errorWrap">
    <p class="eyebrow">THE CZAR'S MODEL LAB</p>
    <h1>Model board unavailable</h1>
    <p class="status">Error {$page.status}: {$page.error?.message || 'Unable to load this week'}</p>
    <p>The official <a href="/best-bets">Best Bets</a> page is unaffected.</p>
    <p>If this persists, share the error code displayed here so the underlying issue can be traced.</p>
</section>

<style>
    .errorWrap {
        width: 92%;
        max-width: 640px;
        margin: 3rem auto 7rem;
        padding: 2rem;
        border: 1px solid var(--ccc);
        border-radius: 1rem;
        line-height: 1.6;
        color: var(--000);
    }
    .eyebrow { color: #ae862d; font-weight: 800; letter-spacing: .12em; font-size: .75rem; }
    h1 { font-size: 1.75rem; margin: .5rem 0; }
    .status { font-weight: 750; }
    a { color: inherit; text-decoration: underline; }
</style>
