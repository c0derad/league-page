<script>
    export let data;

    let search = '';
    let statusFilter = 'ALL';
    let order = 'priority';

    const tierRank = { A: 0, B: 1, C: 2, D: 3 };

    $: board = data.board;
    $: games = board?.games || [];
    $: countBet = games.filter((game) => game.status === 'BET').length;
    $: countWatch = games.filter((game) => game.status === 'WATCH').length;
    $: countPass = games.filter((game) => game.status === 'PASS').length;
    $: visibleGames = games
        .filter((game) => statusFilter === 'ALL' || game.status === statusFilter)
        .filter((game) => {
            const needle = search.toLowerCase().trim();
            return !needle || [
                game.matchup,
                game.v3Pick,
                game.rawPick,
                game.calPick
            ].some((value) => (value || '').toLowerCase().includes(needle));
        })
        .slice()
        .sort((a, b) => {
            if (order === 'kickoff') {
                return String(a.kickoffUtc).localeCompare(String(b.kickoffUtc));
            }
            const tiers = (tierRank[a.tier] ?? 9) - (tierRank[b.tier] ?? 9);
            return tiers || (b.v3Edge ?? -1) - (a.v3Edge ?? -1) ||
                String(a.kickoffUtc).localeCompare(String(b.kickoffUtc));
        });

    const formatKickoff = (value) => {
        if (!value) return 'Time TBD';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return 'Time TBD';
        return date.toLocaleString('en-US', {
            timeZone: 'America/Chicago',
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            timeZoneName: 'short'
        });
    };

    const formatNumber = (value, decimals = 2) =>
        value == null || !Number.isFinite(Number(value))
            ? '—'
            : Number(value).toFixed(decimals);

    const pastKickoff = (value) =>
        Boolean(value) && new Date(value).getTime() <= Date.now();

    const changeWeek = (event) => {
        const [season, week] = event.currentTarget.value.split('-');
        window.location.href = '/cfb-model?season=' + season + '&week=' + week;
    };
</script>

<svelte:head>
    <title>CFB Model Board | TouchDown Syndrome</title>
    <meta name="description" content="The Czar's college football model: projected scores, spread edges, and weekly BET, WATCH, PASS signals." />
</svelte:head>

<main class="modelPage">
    <header class="hero">
        <div class="eyebrow">THE CZAR'S MODEL LAB</div>
        <h1>CFB Model Board</h1>
        <p>Every matchup. Projected score. Market-movement signal. One consistent set of selection rules.</p>

        <div class="pageLinks">
            <a href="/best-bets">Official Best Bets</a>
            <span aria-hidden="true">/</span>
            <strong>Full Model Board</strong>
        </div>
    </header>

    {#if !board}
        <section class="empty">No CFB model snapshots have been published.</section>
    {:else}
        <div class="boardMeta">
            <div>
                <div class="eyebrow">MODEL SNAPSHOT</div>
                <h2>Week {board.week} <span>· {board.season}</span></h2>
                <p>{board.snapshotLabel || 'Snapshot time not provided'}</p>
            </div>
            <label class="weekPicker">
                View week
                <select on:change={changeWeek} value={String(board.season) + '-' + String(board.week)}>
                    {#each data.weeks as item}
                        <option value={String(item.season) + '-' + String(item.week)}>
                            {item.season} · Week {item.week}
                        </option>
                    {/each}
                </select>
            </label>
        </div>

        <div class="overview">
            <div class="metric"><strong>{games.length}</strong><span>Games modeled</span></div>
            <div class="metric betMetric"><strong>{countBet}</strong><span>BET signals</span></div>
            <div class="metric watchMetric"><strong>{countWatch}</strong><span>WATCH signals</span></div>
            <div class="metric"><strong>{countPass}</strong><span>PASS</span></div>
        </div>

        <aside class="disclaimer">
            <strong>Model signals, not official wagers.</strong>
            {board.referenceLineNotice}
            Confidence tiers describe rule alignment, not calibrated probabilities of covering.
            Games that have kicked off are historical views only.
        </aside>

        <section aria-label="CFB model game board">
            <div class="toolbar">
                <div class="statusTabs" aria-label="Filter decisions">
                    {#each ['ALL', 'BET', 'WATCH', 'PASS'] as status}
                        <button type="button" class:active={statusFilter === status} on:click={() => statusFilter = status}>
                            {status === 'ALL' ? 'All' : status}
                        </button>
                    {/each}
                </div>
                <div class="controls">
                    <label class="searchLabel">
                        <span class="srOnly">Search matchups</span>
                        <input type="search" placeholder="Search team or pick" bind:value={search} />
                    </label>
                    <label class="sortLabel">
                        <span class="srOnly">Sort games</span>
                        <select bind:value={order}>
                            <option value="priority">Best signals first</option>
                            <option value="kickoff">Kickoff time</option>
                        </select>
                    </label>
                </div>
            </div>

            <div class="resultsCount">{visibleGames.length} matchups displayed</div>

            {#if visibleGames.length === 0}
                <div class="empty">No matchups match those filters.</div>
            {:else}
                <div class="gameGrid">
                    {#each visibleGames as game (game.id)}
                        <article class="gameCard">
                            <div class="cardTop">
                                <span class="kickoff">{formatKickoff(game.kickoffUtc)}</span>
                                <div class="badges">
                                    {#if pastKickoff(game.kickoffUtc)}
                                        <span class="pastBadge">PAST KICKOFF</span>
                                    {/if}
                                    <span class:bet={game.status === 'BET'} class:watch={game.status === 'WATCH'} class:pass={game.status === 'PASS'} class="signal">
                                        {game.status}
                                    </span>
                                </div>
                            </div>

                            <h3>{game.away} <span>@</span> {game.home}</h3>

                            <div class="scoreBox">
                                <div class="scoreLabel">PROJECTED FINAL SCORE</div>
                                <div class="scoreTeams">
                                    <div><span>{game.away}</span><strong>{formatNumber(game.projectedAway, 1)}</strong></div>
                                    <div><span>{game.home}</span><strong>{formatNumber(game.projectedHome, 1)}</strong></div>
                                </div>
                            </div>

                            <div class="pickStrip">
                                <div>
                                    <small>V3 MODEL SIDE</small>
                                    <strong>{game.v3Pick || 'No pick'}</strong>
                                </div>
                                <div class="tier">
                                    <small>MODEL RATING</small>
                                    <strong>Tier {game.tier}</strong>
                                </div>
                            </div>

                            <div class="edgeGrid">
                                <div><small>Predicted CLV</small><strong>{formatNumber(game.v3Edge, 3)} pts</strong></div>
                                <div><small>Raw edge</small><strong>{formatNumber(game.rawEdge)} pts</strong></div>
                                <div><small>Cal edge</small><strong>{formatNumber(game.calEdge)} pts</strong></div>
                            </div>

                            <div class="flags">
                                {#if game.v3Production}<span>V3 PRODUCTION</span>{/if}
                                {#if game.H3}<span>H3</span>{/if}
                                {#if game.S1}<span>S1</span>{/if}
                                {#if game.v6Qualified}<span>V6</span>{/if}
                                {#if game.referenceLineOnly}<span class="lineFlag">VERIFY LINE</span>{/if}
                            </div>

                            <details>
                                <summary>Why this rating?</summary>
                                <p>{game.reason}</p>
                                <div class="detailsRow"><span>Raw prediction</span><strong>{game.rawPick || '—'}</strong></div>
                                <div class="detailsRow"><span>Calibrated prediction</span><strong>{game.calPick || '—'}</strong></div>
                                {#if game.strategyTags && game.strategyTags.length}
                                    <p class="tagsDetail">Strategy tags: {game.strategyTags.join(' · ')}</p>
                                {/if}
                                <p class="tagsDetail">Model reference lines can differ from bookable odds. A model BET signal is not an official published Czar selection.</p>
                            </details>
                        </article>
                    {/each}
                </div>
            {/if}
        </section>
    {/if}
</main>

<style>
    .modelPage { max-width: 1250px; width: 94%; margin: auto; padding: 2.5rem 0 6rem; color: var(--000); }
    .hero { text-align: center; max-width: 780px; margin: 0 auto 2.5rem; }
    .eyebrow { font-size: .7rem; font-weight: 850; letter-spacing: .16em; color: #9a7b35; }
    h1 { font-size: clamp(2rem,5vw,3.3rem); margin: .25rem 0 .5rem; line-height: 1.15; }
    .hero p { margin: 0; line-height: 1.6; opacity: .72; }
    .pageLinks { display: flex; justify-content: center; gap: .75rem; margin-top: 1.25rem; font-size: .85rem; }
    .pageLinks a { color: inherit; text-underline-offset: 3px; }
    .pageLinks span { opacity: .4; }
    .boardMeta { display: flex; gap: 1.5rem; justify-content: space-between; align-items: end; margin-bottom: 1.3rem; }
    .boardMeta h2 { margin: .15rem 0; font-size: 1.6rem; }
    .boardMeta h2 span { font-weight: 400; opacity: .6; }
    .boardMeta p { font-size: .8rem; opacity: .7; margin: .3rem 0 0; max-width: 650px; }
    .weekPicker { display: flex; flex-direction: column; gap: .35rem; font-size: .75rem; font-weight: 700; flex-shrink: 0; }
    select, input { padding: .7rem .85rem; font: inherit; border: 1px solid var(--ccc); border-radius: .55rem; background: var(--fff); color: var(--000); }
    .overview { display: grid; grid-template-columns: repeat(4,1fr); gap: .8rem; margin-bottom: 1rem; }
    .metric { border: 1px solid var(--ccc); padding: 1.1rem; border-radius: .85rem; display: flex; flex-direction: column; gap: .2rem; }
    .metric strong { font-size: 1.8rem; line-height: 1.1; }
    .metric span { font-size: .72rem; opacity: .7; text-transform: uppercase; font-weight: 800; letter-spacing: .06em; }
    .betMetric { border-left: 4px solid #238b55; }
    .watchMetric { border-left: 4px solid #bc8a2e; }
    .disclaimer { font-size: .8rem; line-height: 1.6; border: 1px solid var(--ccc); border-radius: .65rem; padding: .9rem 1rem; margin: 1rem 0 2rem; }
    .disclaimer strong { margin-right: .3rem; }
    .toolbar { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: .9rem; }
    .statusTabs { display: flex; gap: .35rem; flex-wrap: wrap; }
    .statusTabs button { background: var(--fff); color: var(--000); border: 1px solid var(--ccc); cursor: pointer; border-radius: .6rem; padding: .7rem .95rem; font-weight: 750; }
    .statusTabs button.active { border-color: #ae862d; box-shadow: inset 0 -3px #ae862d; }
    .controls { display: flex; flex-wrap: wrap; gap: .5rem; }
    .controls input { min-width: 180px; }
    .resultsCount { margin: 1rem 0; font-size: .8rem; opacity: .65; }
    .gameGrid { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 1rem; }
    .gameCard { border: 1px solid var(--ccc); border-radius: .95rem; padding: 1.15rem; min-width: 0; }
    .cardTop { display: flex; justify-content: space-between; align-items: center; gap: .5rem; }
    .kickoff { font-size: .73rem; opacity: .7; font-weight: 700; }
    .badges { display: flex; gap: .35rem; align-items: center; flex-wrap: wrap; justify-content: flex-end; }
    .signal { padding: .25rem .5rem; border-radius: .4rem; font-size: .66rem; font-weight: 850; letter-spacing: .07em; background: var(--ccc); }
    .signal.bet { color: #157247; background: #dcefe4; }
    .signal.watch { color: #775016; background: #fbedd5; }
    .signal.pass { color: var(--000); background: var(--ccc); }
    .pastBadge { font-size: .61rem; border: 1px solid var(--ccc); border-radius: .35rem; padding: .2rem .4rem; opacity: .75; }
    h3 { margin: 1rem 0; font-size: 1.1rem; line-height: 1.35; }
    h3 span { opacity: .5; font-weight: 400; }
    .scoreBox { border: 1px solid var(--ccc); border-radius: .65rem; padding: .8rem; }
    .scoreLabel, .pickStrip small, .tier small, .edgeGrid small { display: block; font-size: .64rem; font-weight: 800; letter-spacing: .07em; opacity: .66; }
    .scoreTeams { display: grid; gap: .4rem; margin-top: .6rem; }
    .scoreTeams div { display: flex; justify-content: space-between; align-items: baseline; gap: 1rem; }
    .scoreTeams span { font-size: .84rem; font-weight: 700; }
    .scoreTeams strong { font-size: 1.35rem; }
    .pickStrip { display: flex; justify-content: space-between; align-items: center; gap: .75rem; margin: 1rem 0; }
    .pickStrip strong { display: block; font-size: 1.12rem; margin-top: .2rem; }
    .tier { text-align: right; }
    .edgeGrid { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: .5rem; padding: .85rem 0; border-top: 1px solid var(--ccc); border-bottom: 1px solid var(--ccc); }
    .edgeGrid strong { display: block; font-size: .88rem; margin-top: .3rem; }
    .flags { display: flex; flex-wrap: wrap; gap: .3rem; margin-top: .8rem; }
    .flags span { border: 1px solid var(--ccc); padding: .2rem .4rem; font-size: .64rem; font-weight: 800; border-radius: .35rem; }
    .flags .lineFlag { border-color: #bc8a2e; color: #9e701d; }
    details { border-top: 1px solid var(--ccc); margin-top: 1rem; padding-top: .75rem; font-size: .77rem; }
    summary { cursor: pointer; font-weight: 800; }
    details p { line-height: 1.5; }
    .detailsRow { display: flex; justify-content: space-between; gap: .8rem; padding: .25rem 0; }
    .detailsRow strong { text-align: right; }
    .tagsDetail { font-size: .72rem; opacity: .7; overflow-wrap: anywhere; }
    .empty { padding: 4rem 1rem; text-align: center; border: 1px dashed var(--ccc); border-radius: .8rem; }
    .srOnly { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
    @media (max-width: 770px) {
        .gameGrid { grid-template-columns: 1fr; }
        .overview { grid-template-columns: repeat(2,1fr); }
        .boardMeta { align-items: start; flex-direction: column; }
        .toolbar, .controls { width: 100%; }
        .controls > label, .controls input, .controls select { flex: 1; min-width: 0; width: 100%; }
    }
    @media (max-width: 380px) {
        .edgeGrid { grid-template-columns: 1fr 1fr; }
        .cardTop { align-items: flex-start; flex-direction: column; }
        .badges { justify-content: flex-start; }
    }
</style>
