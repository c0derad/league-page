<script>
    import { goto } from '$app/navigation';

    export let data;

    let search = '';
    let statusFilter = 'ALL';
    let order = 'priority';
    let performanceView = 'production';

    const tierOrder = { A: 0, B: 1, C: 2, D: 3 };

    $: board = data.board;
    $: games = board?.games || [];
    $: strategies = data.performance || [];
    $: stats = strategies.find((item) => item.id === performanceView) || strategies[0];

    $: counts = {
        ALL: games.length,
        BET: games.filter((game) => game.status === 'BET').length,
        WATCH: games.filter((game) => game.status === 'WATCH').length,
        PASS: games.filter((game) => game.status === 'PASS').length
    };

    $: weeks = data.availableWeeks || [];
    $: weekIndex = board ? weeks.indexOf(board.week) : -1;

    $: filtered = games
        .filter((game) => statusFilter === 'ALL' || game.status === statusFilter)
        .filter((game) => {
            const term = search.toLowerCase().trim();
            return !term || [game.matchup, game.v3Pick, game.rawPick, game.calPick]
                .some((value) => String(value || '').toLowerCase().includes(term));
        })
        .slice()
        .sort((a, b) => {
            if (order === 'kickoff') {
                return String(a.kickoffUtc || '').localeCompare(String(b.kickoffUtc || ''));
            }
            if (order === 'edge') {
                return (b.v3Edge ?? -999) - (a.v3Edge ?? -999);
            }
            if (order === 'matchup') {
                return String(a.matchup).localeCompare(String(b.matchup));
            }
            const tierDifference =
                (tierOrder[a.tier] ?? 9) - (tierOrder[b.tier] ?? 9);
            return tierDifference ||
                (b.v3Edge ?? -999) - (a.v3Edge ?? -999) ||
                String(a.kickoffUtc || '').localeCompare(String(b.kickoffUtc || ''));
        });

    const number = (value, decimals = 1) =>
        value == null || !Number.isFinite(Number(value))
            ? '—'
            : Number(value).toFixed(decimals);

    const record = (value) => value
        ? value.wins + '–' + value.losses + '–' + value.pushes
        : '—';

    const percent = (value) =>
        value?.winPct == null ? '—' : number(value.winPct) + '%';

    const roi = (value) =>
        value?.roiPct == null
            ? '—'
            : (value.roiPct > 0 ? '+' : '') + number(value.roiPct, 1) + '%';

    const units = (value) =>
        value?.netUnits == null
            ? '—'
            : (value.netUnits > 0 ? '+' : '') + number(value.netUnits, 2) + 'u';

    const gradedCaption = (value) => {
        if (!value) return 'No results';
        const n = value.graded || 0;
        const pending = value.ungraded || 0;
        return n + ' graded' + (pending ? ' · ' + pending + ' ungraded' : '');
    };

    const kickoff = (value) => {
        const date = value ? new Date(value) : null;
        if (!date || Number.isNaN(date.getTime())) return 'Kickoff TBD';
        return date.toLocaleString('en-US', {
            timeZone: 'America/Chicago',
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        }) + ' CT';
    };

    const started = (value) =>
        Boolean(value) && new Date(value).getTime() <= Date.now();

    const navigate = (season, week) => {
        const params = new URLSearchParams();
        params.set('season', String(season));
        if (week != null) params.set('week', String(week));
        goto('/cfb-model?' + params.toString(), { noScroll: true });
    };

    const switchYear = (event) =>
        navigate(Number(event.currentTarget.value), null);

    const switchWeek = (event) =>
        navigate(board.season, Number(event.currentTarget.value));

    const moveWeek = (delta) => {
        const target = weeks[weekIndex + delta];
        if (board && target != null) navigate(board.season, target);
    };
</script>

<svelte:head>
    <title>The Czar's CFB Model | TouchDown Syndrome</title>
    <meta
        name="description"
        content="The Czar's college football model board: weekly, seasonal and lifetime ATS results, projected scores and ranked game signals."
    />
</svelte:head>

<main class="modelPage">
    <header class="top">
        <div class="topCopy">
            <div class="eyebrow"><span class="blueDot"></span> THE CZAR'S MODEL LAB</div>
            <h1>College Football <span>Model</span></h1>
            <p>Projected scores, ranked spread signals and the historical track record—all in one place.</p>
        </div>
        <a class="officialLink" href="/best-bets">
            <span>View official picks</span>
            <span aria-hidden="true">↗</span>
        </a>
    </header>

    {#if !board}
        <section class="emptyState">No model archive is available.</section>
    {:else}
        <section class="seasonBar" aria-label="Select model season and week">
            <div class="seasonInfo">
                <div class="eyebrow">BROWSE THE ARCHIVE</div>
                <strong>{board.season} <span>/</span> Week {board.week}</strong>
            </div>
            <div class="seasonControls">
                <label class="selectWrap">
                    <span>Season</span>
                    <select aria-label="Choose season" value={String(board.season)} on:change={switchYear}>
                        {#each data.availableYears as year}
                            <option value={year.season}>{year.season}</option>
                        {/each}
                    </select>
                </label>
                <label class="selectWrap">
                    <span>Week</span>
                    <select aria-label="Choose week" value={String(board.week)} on:change={switchWeek}>
                        {#each weeks as week}
                            <option value={week}>Week {week}</option>
                        {/each}
                    </select>
                </label>
                <div class="weekArrows" aria-label="Navigate weeks">
                    <button
                        type="button"
                        aria-label="Previous available week"
                        title="Previous week"
                        disabled={weekIndex <= 0}
                        on:click={() => moveWeek(-1)}
                    >‹</button>
                    <button
                        type="button"
                        aria-label="Next available week"
                        title="Next week"
                        disabled={weekIndex >= weeks.length - 1}
                        on:click={() => moveWeek(1)}
                    >›</button>
                </div>
            </div>
        </section>

        {#if stats}
            <section id="performance" class="performance" aria-labelledby="performance-title">
                <div class="sectionHeading">
                    <div>
                        <div class="eyebrow">HOW THE MODEL HAS PERFORMED</div>
                        <h2 id="performance-title">Track record</h2>
                        <p>Against-the-spread results from the model archive.</p>
                    </div>
                    <label class="selectWrap strategySelect">
                        <span>Show results for</span>
                        <select bind:value={performanceView} aria-label="Performance strategy">
                            {#each strategies as strategy}
                                <option value={strategy.id}>{strategy.label}</option>
                            {/each}
                        </select>
                    </label>
                </div>

                <div class="recordGrid">
                    <article class="recordCard">
                        <div class="recordTop">
                            <span>This week</span>
                            <span class="scopeTag">W{board.week}</span>
                        </div>
                        <div class="recordMain">{record(stats.currentWeek)}</div>
                        <div class="returnStrip">
                            <div class="returnItem">
                                <span>ROI · -110</span>
                                <strong class:positiveReturn={stats.currentWeek.roiPct > 0} class:negativeReturn={stats.currentWeek.roiPct < 0}>{roi(stats.currentWeek)}</strong>
                            </div>
                            <div class="returnItem">
                                <span>Net units</span>
                                <strong class:positiveReturn={stats.currentWeek.netUnits > 0} class:negativeReturn={stats.currentWeek.netUnits < 0}>{units(stats.currentWeek)}</strong>
                            </div>
                        </div>
                        <div class="recordBottom">
                            <strong>{percent(stats.currentWeek)} <span>win rate</span></strong>
                            <span>{gradedCaption(stats.currentWeek)}</span>
                        </div>
                    </article>
                    <article class="recordCard">
                        <div class="recordTop">
                            <span>{board.season} season</span>
                            <span class="scopeTag">YTD</span>
                        </div>
                        <div class="recordMain">{record(stats.currentSeason)}</div>
                        <div class="returnStrip">
                            <div class="returnItem">
                                <span>ROI · -110</span>
                                <strong class:positiveReturn={stats.currentSeason.roiPct > 0} class:negativeReturn={stats.currentSeason.roiPct < 0}>{roi(stats.currentSeason)}</strong>
                            </div>
                            <div class="returnItem">
                                <span>Net units</span>
                                <strong class:positiveReturn={stats.currentSeason.netUnits > 0} class:negativeReturn={stats.currentSeason.netUnits < 0}>{units(stats.currentSeason)}</strong>
                            </div>
                        </div>
                        <div class="recordBottom">
                            <strong>{percent(stats.currentSeason)} <span>win rate</span></strong>
                            <span>{gradedCaption(stats.currentSeason)}</span>
                        </div>
                    </article>
                    <article class="recordCard lifetimeCard">
                        <div class="recordTop">
                            <span>Lifetime archive</span>
                            <span class="scopeTag">ALL YEARS</span>
                        </div>
                        <div class="recordMain">{record(stats.lifetime)}</div>
                        <div class="returnStrip">
                            <div class="returnItem">
                                <span>ROI · -110</span>
                                <strong class:positiveReturn={stats.lifetime.roiPct > 0} class:negativeReturn={stats.lifetime.roiPct < 0}>{roi(stats.lifetime)}</strong>
                            </div>
                            <div class="returnItem">
                                <span>Net units</span>
                                <strong class:positiveReturn={stats.lifetime.netUnits > 0} class:negativeReturn={stats.lifetime.netUnits < 0}>{units(stats.lifetime)}</strong>
                            </div>
                        </div>
                        <div class="recordBottom">
                            <strong>{percent(stats.lifetime)} <span>win rate</span></strong>
                            <span>{gradedCaption(stats.lifetime)}</span>
                        </div>
                    </article>
                </div>

                <div class="recordFooter">
                    <p><strong>{stats.label}</strong> · {stats.note}</p>
                    <a href="#history">Weekly &amp; season breakdown <span aria-hidden="true">↓</span></a>
                </div>
                <p class="returnMethod">
                    <strong>Illustrative ROI:</strong> 1 unit risked per graded selection at -110.
                    Win = +0.91u; loss = -1u; push = 0u.
                    ROI = net units ÷ total graded stakes, including refunded pushes.
                    Ungraded games do not count.
                </p>
            </section>
        {/if}

        <section id="games" class="gamesSection" aria-labelledby="games-title">
            <div class="sectionHeading gamesHeading">
                <div>
                    <div class="eyebrow">EXPLORE THE SLATE</div>
                    <h2 id="games-title">Week {board.week} game board</h2>
                    <p>Choose a signal to filter the board. Select any matchup to see the reasoning.</p>
                </div>
                <div class="gameTotal">
                    <strong>{games.length}</strong>
                    <span>games modeled</span>
                </div>
            </div>

            <div class="filterTabs" aria-label="Filter games by model signal">
                {#each ['ALL', 'BET', 'WATCH', 'PASS'] as filter}
                    <button
                        type="button"
                        class:tabActive={statusFilter === filter}
                        aria-pressed={statusFilter === filter}
                        on:click={() => statusFilter = filter}
                    >
                        <span>{filter === 'ALL' ? 'All games' : filter === 'BET' ? 'Bet signals' : filter === 'WATCH' ? 'Watchlist' : 'Pass'}</span>
                        <span class="tabCount">{counts[filter]}</span>
                    </button>
                {/each}
            </div>

            <div class="boardTools">
                <label class="searchField">
                    <span class="srOnly">Search a team or pick</span>
                    <span class="searchIcon" aria-hidden="true">⌕</span>
                    <input type="search" placeholder="Search a team or pick..." bind:value={search} />
                </label>
                <label class="sortField">
                    <span class="srOnly">Sort games</span>
                    <select aria-label="Sort matchups" bind:value={order}>
                        <option value="priority">Highest-rated first</option>
                        <option value="edge">Largest V3 edge</option>
                        <option value="kickoff">Kickoff time</option>
                        <option value="matchup">Alphabetical</option>
                    </select>
                </label>
            </div>

            <div class="boardLegend">
                <span>{filtered.length} of {games.length} games</span>
                <span><b>BET</b> = model qualifier, not a placed wager</span>
            </div>

            <div class="gameList">
                <div class="gameColumnHead" aria-hidden="true">
                    <span>GAME / KICKOFF</span>
                    <span>PROJECTED SCORE</span>
                    <span>MODEL PICK</span>
                    <span>V3 EDGE</span>
                    <span>RATING</span>
                </div>

                {#if filtered.length === 0}
                    <div class="emptyState">
                        <strong>No games match these filters.</strong>
                        <p>Try another signal or search term.</p>
                        <button type="button" on:click={() => {search = ''; statusFilter = 'ALL';}}>Clear filters</button>
                    </div>
                {:else}
                    {#each filtered as game (game.id)}
                        <details class="gameItem">
                            <summary>
                                <div class="matchupCol">
                                    <div class="matchupTitle">
                                        <strong>{game.away}</strong>
                                        <span class="versus">at</span>
                                        <strong>{game.home}</strong>
                                    </div>
                                    <div class="mutedInfo">
                                        {kickoff(game.kickoffUtc)}
                                        {#if game.actualAway != null && game.actualHome != null}
                                            <span class="finalPill">FINAL</span>
                                        {:else if started(game.kickoffUtc)}
                                            <span>Past kickoff</span>
                                        {/if}
                                    </div>
                                </div>
                                <div class="scoreCol" aria-label="Projected score, away then home">
                                    <strong>{number(game.projectedAway)} <span>–</span> {number(game.projectedHome)}</strong>
                                    <small>Away / Home</small>
                                </div>
                                <div class="pickCol">
                                    <strong>{game.v3Pick || 'No pick'}</strong>
                                    {#if game.v3Result && game.actualAway != null && game.actualHome != null}
                                        <small class:resultWin={game.v3Result === 'WIN'} class:resultLoss={game.v3Result === 'LOSS'}>V3 {game.v3Result}</small>
                                    {:else}
                                        <small>Model reference line</small>
                                    {/if}
                                </div>
                                <div class="edgeCol">
                                    <strong>{game.v3Edge == null ? '—' : (game.v3Edge >= 0 ? '+' : '') + number(game.v3Edge, 3)}</strong>
                                    <small>points</small>
                                </div>
                                <div class="ratingCol">
                                    <span class="signal" class:isBet={game.status === 'BET'} class:isWatch={game.status === 'WATCH'} class:isPass={game.status === 'PASS'}>{game.status}</span>
                                    <small>Tier {game.tier}</small>
                                    <span class="expandArrow" aria-hidden="true">⌄</span>
                                </div>
                            </summary>

                            <div class="gameDetails">
                                <div class="detailPrimary">
                                    <h3>Why {game.status.toLowerCase()}?</h3>
                                    <p>{game.reason}.</p>
                                    {#if game.referenceLineOnly}
                                        <div class="lineNotice">This is a quarter-point or otherwise nonstandard model reference. Verify a real sportsbook price before considering it.</div>
                                    {/if}
                                    {#if game.actualAway != null && game.actualHome != null}
                                        <div class="finalScore">
                                            <span>FINAL SCORE</span>
                                            <strong>{game.away} {number(game.actualAway, 0)} · {game.home} {number(game.actualHome, 0)}</strong>
                                            <span>V3 result: {game.v3Result || 'ungraded'}</span>
                                        </div>
                                    {/if}
                                    {#if game.strategyTags && game.strategyTags.length}
                                        <div class="tagGroup">
                                            {#each game.strategyTags as tag}
                                                <span>{tag.replaceAll('_', ' ')}</span>
                                            {/each}
                                        </div>
                                    {/if}
                                </div>
                                <div class="detailStats">
                                    <div><span>Raw model pick</span><strong>{game.rawPick || '—'}</strong></div>
                                    <div><span>Raw model edge</span><strong>{number(game.rawEdge, 2)} pts</strong></div>
                                    <div><span>Calibrated pick</span><strong>{game.calPick || '—'}</strong></div>
                                    <div><span>Calibrated edge</span><strong>{number(game.calEdge, 2)} pts</strong></div>
                                    <div><span>V3 production</span><strong>{game.v3Production ? 'Yes' : 'No'}</strong></div>
                                    <div><span>H3 / S1</span><strong>{game.H3 ? 'H3' : '—'} / {game.S1 ? 'S1' : '—'}</strong></div>
                                    <div><span>Source</span><strong>{game.sourceType || 'Unknown'}</strong></div>
                                </div>
                            </div>
                        </details>
                    {/each}
                {/if}
            </div>
            <p class="underBoard">Projected score lists the away team first, then the home team. Spreads are archived model reference lines, not verified live sportsbook odds. A BET label is a screening decision, not an official Czar pick.</p>
        </section>

        {#if stats}
            <section id="history" class="historySection" aria-labelledby="history-title">
                <div class="sectionHeading">
                    <div>
                        <div class="eyebrow">GO DEEPER</div>
                        <h2 id="history-title">Historical breakdown</h2>
                        <p>Track the selected strategy across weeks and seasons.</p>
                    </div>
                </div>

                <div class="historyGrid">
                    <div class="historyPanel">
                        <h3>{board.season} · Week by week</h3>
                        <p>Select a week to jump to its game board.</p>
                        <div class="tableScroller">
                            <table>
                                <thead>
                                    <tr><th>Week</th><th>Record</th><th>ROI</th><th>Units</th><th>Win %</th><th>Pending</th></tr>
                                </thead>
                                <tbody>
                                    {#each stats.weeks as item}
                                        <tr class:activeRow={item.week === board.week}>
                                            <td><a href={'/cfb-model?season=' + board.season + '&week=' + item.week}>Week {item.week}</a></td>
                                            <td><strong>{record(item)}</strong></td>
                                            <td class:positiveReturn={item.roiPct > 0} class:negativeReturn={item.roiPct < 0}><strong>{roi(item)}</strong></td>
                                            <td class:positiveReturn={item.netUnits > 0} class:negativeReturn={item.netUnits < 0}>{units(item)}</td>
                                            <td>{percent(item)}</td>
                                            <td>{item.ungraded || '—'}</td>
                                        </tr>
                                    {/each}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div class="historyPanel">
                        <h3>Season by season</h3>
                        <p>Select a year to see its model results.</p>
                        <div class="tableScroller">
                            <table>
                                <thead>
                                    <tr><th>Year</th><th>Record</th><th>ROI</th><th>Units</th><th>Win %</th><th>Pending</th></tr>
                                </thead>
                                <tbody>
                                    {#each stats.seasons as item}
                                        <tr class:activeRow={item.season === board.season}>
                                            <td><a href={'/cfb-model?season=' + item.season}>{item.season}</a></td>
                                            <td><strong>{record(item)}</strong></td>
                                            <td class:positiveReturn={item.roiPct > 0} class:negativeReturn={item.roiPct < 0}><strong>{roi(item)}</strong></td>
                                            <td class:positiveReturn={item.netUnits > 0} class:negativeReturn={item.netUnits < 0}>{units(item)}</td>
                                            <td>{percent(item)}</td>
                                            <td>{item.ungraded || '—'}</td>
                                        </tr>
                                    {/each}
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <th>Lifetime</th>
                                        <td><strong>{record(stats.lifetime)}</strong></td>
                                        <td class:positiveReturn={stats.lifetime.roiPct > 0} class:negativeReturn={stats.lifetime.roiPct < 0}>{roi(stats.lifetime)}</td>
                                        <td class:positiveReturn={stats.lifetime.netUnits > 0} class:negativeReturn={stats.lifetime.netUnits < 0}>{units(stats.lifetime)}</td>
                                        <td>{percent(stats.lifetime)}</td>
                                        <td>{stats.lifetime.ungraded || '—'}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                </div>
            </section>
        {/if}

        <section class="methodNote" aria-label="Model notes and data limitations">
            <div class="eyebrow">ABOUT THESE NUMBERS</div>
            <p><strong>Model results ≠ actual bets.</strong> W–L–P uses recorded V3 model-side outcomes. Win rate excludes pushes; ungraded games are excluded from W–L–P and ROI. Net units and ROI are hypothetical flat-stake returns at assumed -110 odds; neither actual betting prices nor historical bookability is verified. Historical 2023–2025 grades are reconstructed, not verified pregame bets, and 2022 covers only Weeks 9–15.</p>
            <p>BET/WATCH/PASS tiers summarize model qualifications, <strong>not calibrated probabilities</strong>. The archive uses its original week labels, including some postseason-dated games grouped into historical Week 1. Data source: {board.sourceFile}.</p>
            <a href="/best-bets">See the separately maintained official Best Bets record →</a>
        </section>
    {/if}
</main>

<style>
    .modelPage { --accent: #4b8ed0; --subtleBorder: var(--ccc); --surface: var(--fff); --surfaceMuted: var(--eee); width: min(94%, 1250px); margin: 0 auto; color: var(--000); padding: 2.6rem 0 6rem; }
    .eyebrow { font-size: .68rem; letter-spacing: .15em; font-weight: 850; color: var(--accent); line-height: 1.4; }
    .blueDot { display: inline-block; width: .46rem; height: .46rem; border-radius: 50%; background: var(--accent); margin-right: .25rem; vertical-align: middle; }
    .top { display: flex; align-items: flex-start; justify-content: space-between; gap: 1.5rem; padding: .4rem 0 2rem; }
    .top h1 { margin: .45rem 0 .65rem; font-size: clamp(2.1rem, 4.3vw, 3.5rem); letter-spacing: -.04em; line-height: 1.05; font-weight: 850; }
    .top h1 span { color: var(--accent); }
    .top p { max-width: 680px; margin: 0; font-size: .97rem; line-height: 1.6; opacity: .75; }
    .officialLink { display: flex; align-items: center; gap: .8rem; margin-top: 1rem; text-decoration: none; color: var(--000); border: 1px solid var(--subtleBorder); border-radius: .55rem; padding: .7rem .9rem; white-space: nowrap; font-weight: 800; font-size: .76rem; }
    .officialLink:hover { border-color: var(--accent); }
    .seasonBar { padding: 1.1rem 1.25rem; border: 1px solid var(--subtleBorder); border-radius: .9rem; display: flex; justify-content: space-between; align-items: center; gap: 1rem; background: var(--surface); }
    .seasonInfo strong { font-size: 1.3rem; display: block; margin-top: .25rem; font-variant-numeric: tabular-nums; }
    .seasonInfo strong span { opacity: .35; margin: 0 .2rem; }
    .seasonControls { display: flex; gap: .6rem; align-items: end; }
    .selectWrap { display: flex; flex-direction: column; gap: .35rem; font-size: .7rem; letter-spacing: .02em; font-weight: 750; min-width: 110px; }
    select, input { border: 1px solid var(--subtleBorder); border-radius: .52rem; background: var(--surface); color: var(--000); font: inherit; }
    select { padding: .68rem 2rem .68rem .75rem; cursor: pointer; }
    .weekArrows { display: flex; gap: .3rem; align-items: center; }
    .weekArrows button { width: 39px; height: 39px; font-size: 1.4rem; line-height: 1; background: var(--surface); color: var(--000); border: 1px solid var(--subtleBorder); border-radius: .5rem; cursor: pointer; }
    .weekArrows button:disabled { cursor: not-allowed; opacity: .3; }
    .weekArrows button:not(:disabled):hover { border-color: var(--accent); }
    .performance, .gamesSection, .historySection { margin-top: 2.7rem; }
    .sectionHeading { display: flex; align-items: end; justify-content: space-between; gap: 1rem; margin-bottom: 1.15rem; }
    .sectionHeading h2 { margin: .25rem 0; font-size: clamp(1.45rem, 2.2vw, 1.8rem); letter-spacing: -.025em; }
    .sectionHeading p { margin: .2rem 0 0; font-size: .82rem; opacity: .7; line-height: 1.4; }
    .strategySelect { min-width: 230px; }
    .recordGrid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: .85rem; }
    .recordCard { padding: 1.2rem 1.25rem; border: 1px solid var(--subtleBorder); border-radius: .85rem; background: var(--surface); min-width: 0; }
    .lifetimeCard { border-top: 3px solid var(--accent); padding-top: calc(1.2rem - 2px); }
    .recordTop { display: flex; align-items: center; justify-content: space-between; gap: .5rem; font-size: .83rem; font-weight: 800; }
    .scopeTag { border: 1px solid var(--subtleBorder); border-radius: .35rem; font-size: .6rem; letter-spacing: .07em; padding: .22rem .4rem; opacity: .65; }
    .recordMain { font-size: clamp(1.7rem, 3.5vw, 2.65rem); letter-spacing: -.035em; font-weight: 850; font-variant-numeric: tabular-nums; margin: 1rem 0 .65rem; white-space: nowrap; }
    .returnStrip { display: grid; grid-template-columns: 1fr 1fr; gap: .7rem; margin-bottom: .85rem; }
    .returnItem { display: flex; flex-direction: column; gap: .2rem; }
    .returnItem > span { font-size: .63rem; font-weight: 750; opacity: .65; }
    .returnItem strong { font-size: clamp(1rem, 1.8vw, 1.25rem); font-weight: 850; font-variant-numeric: tabular-nums; }
    .positiveReturn { color: #26865b; }
    .negativeReturn { color: #bd5757; }
    .returnMethod { font-size: .71rem; opacity: .7; line-height: 1.6; margin: .5rem 0 0; }
    .recordBottom { display: flex; justify-content: space-between; align-items: center; gap: .7rem; font-size: .7rem; border-top: 1px solid var(--subtleBorder); padding-top: .8rem; }
    .recordBottom strong { white-space: nowrap; }
    .recordBottom strong span { font-weight: 500; opacity: .65; }
    .recordBottom > span { opacity: .66; text-align: right; }
    .recordFooter { display: flex; justify-content: space-between; gap: 1rem; align-items: center; margin-top: .8rem; font-size: .76rem; }
    .recordFooter p { opacity: .72; line-height: 1.5; margin: 0; }
    .recordFooter a { color: var(--accent); white-space: nowrap; text-decoration: none; font-weight: 800; }
    .recordFooter a:hover { text-decoration: underline; }
    .gamesHeading { margin-bottom: 1.2rem; }
    .gameTotal { display: flex; align-items: baseline; gap: .4rem; white-space: nowrap; }
    .gameTotal strong { font-size: 2.1rem; letter-spacing: -.03em; }
    .gameTotal span { opacity: .65; font-size: .73rem; }
    .filterTabs { display: flex; gap: .5rem; flex-wrap: wrap; margin-bottom: 1rem; }
    .filterTabs button { padding: .7rem .9rem; background: var(--surface); color: var(--000); border: 1px solid var(--subtleBorder); border-radius: .55rem; display: flex; align-items: center; gap: .55rem; font-size: .8rem; font-weight: 800; cursor: pointer; }
    .filterTabs button:hover { border-color: var(--accent); }
    .filterTabs button.tabActive { border-color: var(--accent); box-shadow: inset 0 -2px var(--accent); }
    .tabCount { border-radius: .4rem; padding: .1rem .38rem; background: var(--surfaceMuted); font-size: .73rem; font-variant-numeric: tabular-nums; }
    .boardTools { display: flex; align-items: center; justify-content: space-between; gap: .65rem; margin-bottom: .7rem; }
    .searchField { position: relative; flex: 1; max-width: 500px; }
    .searchField input { width: 100%; box-sizing: border-box; padding: .75rem 1rem .75rem 2.1rem; font-size: .85rem; }
    .searchIcon { position: absolute; left: .7rem; top: .3rem; opacity: .55; font-size: 1.5rem; pointer-events: none; }
    .sortField select { font-size: .82rem; min-width: 180px; }
    .boardLegend { display: flex; align-items: center; justify-content: space-between; gap: .7rem; font-size: .71rem; opacity: .65; margin: 0 0 .5rem; }
    .gameList { border: 1px solid var(--subtleBorder); border-radius: .85rem; background: var(--surface); overflow: hidden; }
    .gameColumnHead, .gameItem > summary { display: grid; grid-template-columns: minmax(0, 2.1fr) minmax(108px, .85fr) minmax(0, 1.28fr) minmax(78px, .64fr) minmax(80px, .68fr); gap: .7rem; align-items: center; }
    .gameColumnHead { padding: .8rem 1.15rem; background: var(--surfaceMuted); font-size: .62rem; letter-spacing: .08em; font-weight: 850; opacity: .78; }
    .gameItem { border-top: 1px solid var(--subtleBorder); }
    .gameItem > summary { list-style: none; padding: .95rem 1.15rem; cursor: pointer; min-height: 70px; }
    .gameItem > summary::-webkit-details-marker { display: none; }
    .gameItem > summary:hover, .gameItem[open] > summary { background: var(--surfaceMuted); }
    .matchupTitle { display: flex; flex-wrap: wrap; align-items: baseline; column-gap: .33rem; row-gap: .15rem; font-size: .85rem; line-height: 1.4; }
    .versus { opacity: .52; font-weight: 500; font-size: .76rem; }
    .mutedInfo { display: flex; flex-wrap: wrap; align-items: center; gap: .4rem; font-size: .67rem; opacity: .7; margin-top: .35rem; }
    .finalPill { border: 1px solid var(--subtleBorder); border-radius: .25rem; padding: .08rem .27rem; font-size: .57rem; font-weight: 800; }
    .scoreCol strong, .pickCol strong, .edgeCol strong { display: block; font-size: .88rem; font-variant-numeric: tabular-nums; line-height: 1.35; }
    .scoreCol strong { font-size: 1.02rem; }
    .scoreCol strong span { opacity: .4; }
    .pickCol strong { overflow-wrap: anywhere; }
    .scoreCol small, .pickCol small, .edgeCol small, .ratingCol small { display: block; margin-top: .25rem; font-size: .62rem; opacity: .64; line-height: 1.35; }
    .pickCol .resultWin { color: #2a9469; opacity: 1; font-weight: 800; }
    .pickCol .resultLoss { color: #c26767; opacity: 1; font-weight: 800; }
    .ratingCol { display: flex; align-items: start; justify-content: center; flex-direction: column; position: relative; padding-right: .7rem; }
    .signal { font-size: .65rem; font-weight: 900; letter-spacing: .045em; padding: .32rem .52rem; border-radius: .36rem; border: 1px solid var(--subtleBorder); }
    .signal.isBet { background: #dcf2e6; color: #16653d; border-color: #b7dfc9; }
    .signal.isWatch { background: #fff0d5; color: #805216; border-color: #f2d59f; }
    .signal.isPass { background: var(--surfaceMuted); color: var(--000); }
    .expandArrow { position: absolute; right: 0; top: 8px; font-size: .95rem; opacity: .5; transition: transform .2s; }
    .gameItem[open] .expandArrow { transform: rotate(180deg); }
    .gameDetails { display: grid; grid-template-columns: minmax(0, 1.35fr) minmax(230px, 1fr); gap: 1.7rem; padding: 1.25rem 1.45rem 1.4rem; border-top: 1px solid var(--subtleBorder); }
    .detailPrimary h3 { font-size: .95rem; margin: 0 0 .5rem; }
    .detailPrimary p { font-size: .8rem; line-height: 1.6; margin: 0 0 .85rem; opacity: .85; }
    .detailStats { display: grid; grid-template-columns: 1fr 1fr; column-gap: .65rem; row-gap: .85rem; align-content: start; }
    .detailStats > div { border-bottom: 1px solid var(--subtleBorder); padding-bottom: .6rem; min-width: 0; }
    .detailStats span { display: block; font-size: .65rem; opacity: .66; margin-bottom: .3rem; }
    .detailStats strong { font-size: .77rem; font-weight: 800; overflow-wrap: anywhere; }
    .lineNotice { padding: .65rem .8rem; border-left: 3px solid #ce9a3b; font-size: .75rem; line-height: 1.5; margin-bottom: .9rem; }
    .finalScore { display: flex; align-items: baseline; flex-wrap: wrap; column-gap: .6rem; row-gap: .3rem; margin-bottom: .85rem; }
    .finalScore > span { font-size: .62rem; opacity: .65; }
    .finalScore > strong { font-size: .8rem; }
    .tagGroup { display: flex; flex-wrap: wrap; gap: .3rem; }
    .tagGroup span { font-size: .59rem; border: 1px solid var(--subtleBorder); border-radius: .3rem; padding: .22rem .35rem; opacity: .7; overflow-wrap: anywhere; }
    .underBoard { margin: .85rem 0 0; font-size: .71rem; line-height: 1.55; opacity: .67; }
    .historyGrid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: .9rem; }
    .historyPanel { border: 1px solid var(--subtleBorder); border-radius: .85rem; padding: 1rem 1.1rem; min-width: 0; }
    .historyPanel h3 { margin: 0 0 .3rem; font-size: 1rem; }
    .historyPanel > p { margin: 0 0 .85rem; font-size: .75rem; opacity: .65; }
    .tableScroller { max-height: 400px; overflow: auto; }
    table { width: 100%; border-collapse: collapse; font-size: .78rem; font-variant-numeric: tabular-nums; }
    th, td { padding: .64rem .55rem; text-align: right; border-bottom: 1px solid var(--subtleBorder); white-space: nowrap; }
    th:first-child, td:first-child { text-align: left; }
    thead th { font-size: .66rem; letter-spacing: .05em; opacity: .7; }
    table a { color: inherit; text-decoration: none; border-bottom: 1px solid var(--accent); }
    table a:hover { color: var(--accent); }
    tr.activeRow { color: var(--accent); font-weight: 800; }
    tfoot { font-weight: 850; }
    .methodNote { border-top: 1px solid var(--subtleBorder); margin-top: 3rem; padding-top: 1.5rem; max-width: 1020px; }
    .methodNote p { opacity: .7; line-height: 1.65; font-size: .74rem; margin: .6rem 0; }
    .methodNote a { font-size: .76rem; color: var(--accent); font-weight: 800; text-decoration: none; }
    .emptyState { text-align: center; padding: 3rem 1rem; font-size: .83rem; }
    .emptyState p { opacity: .7; }
    .emptyState button { cursor: pointer; background: var(--surface); color: var(--000); border: 1px solid var(--subtleBorder); border-radius: .5rem; padding: .6rem .8rem; }
    .srOnly { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
    @media (max-width: 980px) {
        .gameColumnHead, .gameItem > summary { grid-template-columns: minmax(0, 1.7fr) minmax(93px, .8fr) minmax(0, 1.05fr) minmax(65px, .62fr) minmax(65px, .58fr); gap: .5rem; }
        .matchupTitle, .pickCol strong { font-size: .79rem; }
        .gameColumnHead, .gameItem > summary { padding-left: .8rem; padding-right: .8rem; }
    }
    @media (max-width: 760px) {
        .modelPage { width: 93%; padding-top: 1.6rem; }
        .top { flex-direction: column; padding-bottom: 1.5rem; gap: .7rem; }
        .officialLink { margin-top: 0; }
        .seasonBar { align-items: stretch; flex-direction: column; }
        .seasonControls { width: 100%; }
        .seasonControls .selectWrap { flex: 1; min-width: 0; }
        .seasonControls select { width: 100%; }
        .sectionHeading { flex-direction: column; align-items: stretch; }
        .strategySelect { min-width: 0; width: 100%; }
        .strategySelect select { width: 100%; }
        .recordGrid { grid-template-columns: 1fr 1fr; }
        .lifetimeCard { grid-column: 1 / -1; }
        .recordFooter { align-items: start; flex-direction: column; }
        .boardTools { align-items: stretch; }
        .searchField { max-width: none; }
        .historyGrid { grid-template-columns: 1fr; }
        .gameColumnHead { display: none; }
        .gameItem > summary { grid-template-columns: minmax(0, 1fr) auto; grid-template-areas: "match rating" "score pick" "edge edge"; align-items: start; gap: .55rem .9rem; }
        .matchupCol { grid-area: match; }
        .scoreCol { grid-area: score; }
        .pickCol { grid-area: pick; text-align: right; }
        .edgeCol { grid-area: edge; display: flex; align-items: baseline; gap: .4rem; border-top: 1px solid var(--subtleBorder); padding-top: .5rem; }
        .edgeCol::before { content: "V3 predicted CLV"; display: inline; font-size: .68rem; opacity: .65; margin-right: auto; }
        .edgeCol small { display: none; }
        .ratingCol { grid-area: rating; align-items: end; padding-right: .8rem; }
        .ratingCol small { text-align: right; }
        .gameDetails { grid-template-columns: 1fr; gap: 1.1rem; }
    }
    @media (max-width: 520px) {
        .recordGrid { grid-template-columns: 1fr; }
        .lifetimeCard { grid-column: auto; }
        .recordMain { margin: .5rem 0; font-size: 1.9rem; }
        .filterTabs { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .filterTabs button { justify-content: space-between; }
        .boardTools { flex-direction: column; }
        .searchField, .sortField, .sortField select { width: 100%; box-sizing: border-box; }
        .boardLegend { flex-direction: column; align-items: start; }
        .seasonBar { padding: 1rem; }
        .weekArrows button { width: 33px; }
        .seasonControls { gap: .35rem; }
    }
</style>
