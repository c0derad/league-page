<script>
    import { goto, replaceState } from '$app/navigation';

    export let data;

    let search = '';
    let order = data.selectedSort || 'priority';
    let resultFilter = data.selectedResult || 'ALL';
    let statusFilter = data.selectedSignal || 'ALL';
    let selectedGrades = [...(data.selectedGrades || [])];
    let performanceView = data.selectedStrategy || 'all';
    let visibleLimit = 20;
    // User-entered sportsbook quotes are session-only; no odds feed is connected.
    let watchLiveLines = {};

    const gradeOptions = ['A', 'B', 'C', 'D'];
    const resultOptions = [
        {id: 'ALL', label: 'All results'},
        {id: 'GRADED', label: 'Graded'},
        {id: 'UNGRADED', label: 'Ungraded'},
        {id: 'WIN', label: 'Wins'},
        {id: 'LOSS', label: 'Losses'},
        {id: 'PUSH', label: 'Pushes'}
    ];
    const gradedResults = new Set(['WIN', 'LOSS', 'PUSH']);
    const resultMatches = (game, selected) => {
        const graded = gradedResults.has(game.v3Result);
        return selected === 'ALL' || (selected === 'GRADED' && graded) ||
            (selected === 'UNGRADED' && !graded) || game.v3Result === selected;
    };
    const strategyOptions = [
        {id: 'all', label: 'All V3 model sides', note: 'All archived V3 model-side outcomes matching the Signal and Grade filters.'},
        {id: 'production', label: 'V3 production only', note: 'Production-qualified V3 games matching the Signal and Grade filters.'},
        {id: 'sweet', label: 'V3/raw 0.75–1.00 only', note: 'V3/raw agreement in the 0.75–1.00 band, within the Signal and Grade filters.'}
    ];

    const tierOrder = { A: 0, B: 1, C: 2, D: 3 };
    const watchImprovementSteps = [3, 5, 7];
    const pickParts = (pick) => {
        const match = String(pick || '').trim().match(/^(.*?)\s+([+-]\d+(?:\.\d+)?)$/);
        return match ? {team: match[1], spread: Number(match[2])} : null;
    };
    const spreadLabel = (points) => {
        const rounded = Math.round((points + Number.EPSILON) * 100) / 100;
        return (rounded > 0 ? '+' : '') + String(rounded);
    };
    const useV9 = (game) => Boolean(game.v3Live && game.v9);
    const boardPick = (game) => useV9(game) && game.v9?.selectedTeam && game.v9?.frozenSelectedSpread != null
        ? game.v9.selectedTeam + ' ' + spreadLabel(game.v9.frozenSelectedSpread)
        : game.v3Pick;
    const boardEdge = (game) => useV9(game) ? (game.v9.predictedEdge ?? game.v3Edge) : game.v3Edge;
    const boardAwayScore = (game) => useV9(game) ? (game.v9.predictedAway ?? game.projectedAway) : game.projectedAway;
    const boardHomeScore = (game) => useV9(game) ? (game.v9.predictedHome ?? game.projectedHome) : game.projectedHome;
    const targetLine = (game, improvement) => {
        const pick = pickParts(boardPick(game));
        return pick ? pick.team + ' ' + spreadLabel(pick.spread + improvement) : '—';
    };
    const lineImprovement = (game) => {
        const pick = pickParts(boardPick(game));
        const quoted = watchLiveLines[game.id];
        if (!pick || quoted == null || String(quoted).trim() === '') return null;
        const live = Number(quoted);
        return Number.isFinite(live) ? live - pick.spread : null;
    };
    const setWatchLine = (id, value) => {
        watchLiveLines = {...watchLiveLines, [id]: value};
    };

    $: board = data.board;
    $: games = board?.games || [];
    $: activeStrategy = strategyOptions.find((item) => item.id === performanceView) || strategyOptions[0];

    const sumRows = (rows) => {
        const result = {wins: 0, losses: 0, pushes: 0, ungraded: 0, total: 0};
        for (const row of rows) {
            result.wins += row.wins;
            result.losses += row.losses;
            result.pushes += row.pushes;
            result.ungraded += row.ungraded;
        }
        result.graded = result.wins + result.losses + result.pushes;
        result.total = result.graded + result.ungraded;
        result.winPct = result.wins + result.losses
            ? Math.round(1000 * result.wins / (result.wins + result.losses)) / 10
            : null;
        result.stakeUnits = result.graded;
        result.netUnits = result.graded
            ? result.wins * 100 / 110 - result.losses
            : null;
        result.roiPct = result.graded
            ? 100 * result.netUnits / result.graded
            : null;
        return result;
    };

    // Recalculate just a compact ~43 KB summary in the browser. Changes to
    // signal, grades and strategy make zero HTTP requests.
    $: summaryMatches = (data.summaryRows || []).filter((row) =>
        row.strategy === performanceView &&
        signalMatches(row, statusFilter) &&
        (!selectedGrades.length || selectedGrades.includes(row.tier))
    );
    $: stats = board ? {
        ...activeStrategy,
        currentWeek: sumRows(summaryMatches.filter((row) =>
            row.season === board.season && row.week === board.week)),
        currentSeason: sumRows(summaryMatches.filter((row) =>
            row.season === board.season)),
        lifetime: sumRows(summaryMatches),
        weeks: (data.availableWeeks || []).map((week) => ({
            week,
            ...sumRows(summaryMatches.filter((row) =>
                row.season === board.season && row.week === week))
        })),
        seasons: (data.availableYears || []).map((item) => ({
            season: item.season,
            ...sumRows(summaryMatches.filter((row) => row.season === item.season))
        }))
    } : null;

    const signalMatches = (game, selectedSignal) =>
        selectedSignal === 'ALL' ||
        (selectedSignal === 'BET_WATCH'
            ? game.status === 'BET' || game.status === 'WATCH'
            : game.status === selectedSignal);

    $: counts = Object.fromEntries(
        ['ALL', 'BET', 'WATCH', 'BET_WATCH', 'PASS'].map((signal) => [
            signal,
            games.filter((game) => signalMatches(game, signal) &&
                (selectedGrades.length === 0 || selectedGrades.includes(game.tier))).length
        ])
    );
    $: gradeCounts = Object.fromEntries(
        gradeOptions.map((grade) => [
            grade,
            games.filter((game) => signalMatches(game, statusFilter) && game.tier === grade).length
        ])
    );

    $: weeks = data.availableWeeks || [];
    $: weekIndex = board ? weeks.indexOf(board.week) : -1;

    $: filtered = games
        .filter((game) => signalMatches(game, statusFilter))
        .filter((game) => selectedGrades.length === 0 || selectedGrades.includes(game.tier))
        .filter((game) => resultMatches(game, resultFilter))
        .filter((game) => {
            const term = search.toLowerCase().trim();
            return !term || [game.matchup, boardPick(game), game.v3Pick, game.rawPick, game.calPick]
                .some((value) => String(value || '').toLowerCase().includes(term));
        })
        .slice()
        .sort((a, b) => {
            if (order === 'kickoff' || order === 'kickoff_desc') {
                // Null/TBD kickoffs stay last regardless of direction.
                if (!a.kickoffUtc || !b.kickoffUtc) {
                    return a.kickoffUtc ? -1 : b.kickoffUtc ? 1 : 0;
                }
                const comparison = String(a.kickoffUtc).localeCompare(String(b.kickoffUtc));
                return order === 'kickoff_desc' ? -comparison : comparison ||
                    String(a.matchup).localeCompare(String(b.matchup));
            }
            if (order === 'edge') {
                return (boardEdge(b) ?? -999) - (boardEdge(a) ?? -999);
            }
            if (order === 'matchup') {
                return String(a.matchup).localeCompare(String(b.matchup));
            }
            const tierDifference =
                (tierOrder[a.tier] ?? 9) - (tierOrder[b.tier] ?? 9);
            return tierDifference ||
                (boardEdge(b) ?? -999) - (boardEdge(a) ?? -999) ||
                String(a.kickoffUtc || '').localeCompare(String(b.kickoffUtc || ''));
        });
    $: shownGames = filtered.slice(0, visibleLimit);

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

    const archiveHref = (
        season,
        week,
        signal = statusFilter,
        grades = selectedGrades,
        strategy = performanceView
    ) => {
        const params = new URLSearchParams();
        params.set('season', String(season));
        if (week != null) params.set('week', String(week));
        if (signal !== 'ALL') params.set('signal', signal);
        if (grades.length) params.set('grades', [...grades].sort().join(','));
        if (strategy !== 'all') params.set('strategy', strategy);
        if (resultFilter !== 'ALL') params.set('result', resultFilter);
        if (order !== 'priority') params.set('sort', order);
        return '/cfb-model?' + params.toString();
    };

    // Year/week navigation retrieves only that season. All filtering stays
    // client-side and updates the shareable URL without reloading the page.
    const navigate = (season, week) => {
        visibleLimit = 20;
        goto(archiveHref(season, week), { noScroll: true });
    };

    const syncFilterUrl = () => {
        if (board) {
            replaceState(archiveHref(board.season, board.week), {});
        }
    };

    const switchYear = (event) =>
        navigate(Number(event.currentTarget.value), null);

    const switchWeek = (event) =>
        navigate(board.season, Number(event.currentTarget.value));

    const moveWeek = (delta) => {
        const target = weeks[weekIndex + delta];
        if (board && target != null) navigate(board.season, target);
    };

    const switchSignal = (signal) => {
        statusFilter = signal;
        visibleLimit = 20;
        syncFilterUrl();
    };

    const toggleGrade = (grade) => {
        selectedGrades = selectedGrades.includes(grade)
            ? selectedGrades.filter((item) => item !== grade)
            : [...selectedGrades, grade].sort();
        visibleLimit = 20;
        syncFilterUrl();
    };

    const clearGrades = () => {
        selectedGrades = [];
        visibleLimit = 20;
        syncFilterUrl();
    };

    const switchPerformanceStrategy = (event) => {
        performanceView = event.currentTarget.value;
        syncFilterUrl();
    };

    const switchResult = (event) => {
        resultFilter = event.currentTarget.value;
        visibleLimit = 20;
        syncFilterUrl();
    };

    const switchSort = (event) => {
        order = event.currentTarget.value;
        visibleLimit = 20;
        syncFilterUrl();
    };

    const clearBoardFilters = () => {
        search = '';
        statusFilter = 'ALL';
        selectedGrades = [];
        resultFilter = 'ALL';
        order = 'priority';
        visibleLimit = 20;
        syncFilterUrl();
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

        <section class="globalFilters" aria-label="Model filters">
            <div class="filterHead">
                <div>
                    <div class="eyebrow">FILTER YOUR MODEL BOARD</div>
                    <p>Signal and grade remain independent. Week 11 uses the V9 production screens, while older weeks retain V3 screening and graded outcomes remain V3.</p>
                </div>
                {#if statusFilter !== 'ALL' || selectedGrades.length}
                    <button class="resetFilters" type="button" on:click={clearBoardFilters}>Reset filters</button>
                {/if}
            </div>

            <div class="filterGroup">
                <div class="filterRowTitle">
                    <strong>Signal</strong>
                    <span>Choose one</span>
                </div>
                <div class="filterTabs" role="group" aria-label="Select model signal">
                    {#each ['ALL', 'BET', 'WATCH', 'BET_WATCH', 'PASS'] as filter}
                        <button
                            type="button"
                            class:tabActive={statusFilter === filter}
                            aria-pressed={statusFilter === filter}
                            on:click={() => switchSignal(filter)}
                        >
                            <span>{filter === 'ALL' ? 'All signals' : filter === 'BET' ? 'BET' : filter === 'BET_WATCH' ? 'BET + WATCH' : filter === 'WATCH' ? 'WATCH' : 'PASS'}</span>
                            <span class="tabCount">{counts[filter]}</span>
                        </button>
                    {/each}
                </div>
            </div>

            <div class="filterGroup">
                <div class="filterRowTitle">
                    <strong>Grade</strong>
                    <span>Multi-select any combination · {selectedGrades.length ? selectedGrades.join(' + ') : 'All grades'}</span>
                </div>
                <div class="gradeControls" role="group" aria-label="Select one or more model grades">
                    {#each gradeOptions as grade}
                        <button
                            class="gradeButton"
                            class:gradeActive={selectedGrades.includes(grade)}
                            type="button"
                            aria-pressed={selectedGrades.includes(grade)}
                            aria-label={'Include grade ' + grade}
                            on:click={() => toggleGrade(grade)}
                        >
                            <span>Grade {grade}</span>
                            <span class="gradeCount">{gradeCounts[grade]}</span>
                        </button>
                    {/each}
                    {#if selectedGrades.length}
                        <button class="clearGrade" type="button" on:click={clearGrades}>All grades</button>
                    {/if}
                </div>
                <p class="filterHelp">Choose A + C, A + B + C, or any other mix. Selected grades are combined; only games matching the chosen signal are included.</p>
            </div>
        </section>

        {#if stats}
            <section id="performance" class="performance" aria-labelledby="performance-title">
                <div class="sectionHeading">
                    <div>
                        <div class="eyebrow">HOW THE MODEL HAS PERFORMED</div>
                        <h2 id="performance-title">Track record</h2>
                        <p>Against-the-spread results for your chosen signal and grades. Optionally narrow these to a specific model strategy.</p>
                    </div>
                    <label class="selectWrap strategySelect">
                        <span>Additional model strategy (optional)</span>
                        <select value={performanceView} on:change={switchPerformanceStrategy} aria-label="Performance strategy">
                            {#each strategyOptions as strategy}
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
                    <p>Filter by signal, grade, result or kickoff. Week 11 shows the November 13 V9 production snapshot; earlier weeks retain the archived V3 screening.</p>
                </div>
                <div class="gameTotal">
                    <strong>{games.length}</strong>
                    <span>games modeled</span>
                </div>
            </div>

            <div class="boardTools">
                <label class="searchField">
                    <span class="srOnly">Search a team or pick</span>
                    <span class="searchIcon" aria-hidden="true">⌕</span>
                    <input type="search" placeholder="Search a team or pick..." bind:value={search} />
                </label>
                <label class="sortField">
                    <span class="srOnly">Result status</span>
                    <select aria-label="Filter by graded result" value={resultFilter} on:change={switchResult}>
                        {#each resultOptions as result}
                            <option value={result.id}>{result.label}</option>
                        {/each}
                    </select>
                </label>
                <label class="sortField">
                    <span class="srOnly">Sort games</span>
                    <select aria-label="Sort matchups" value={order} on:change={switchSort}>
                        <option value="priority">Highest-rated first</option>
                        <option value="kickoff">Kickoff: earliest first</option>
                        <option value="kickoff_desc">Kickoff: latest first</option>
                        <option value="edge">Largest predicted CLV</option>
                        <option value="matchup">Alphabetical</option>
                    </select>
                </label>
            </div>

            <div class="boardLegend">
                <span>{filtered.length} of {games.length} games</span>
                <span>Signal: {statusFilter === 'BET_WATCH' ? 'BET + WATCH' : statusFilter === 'ALL' ? 'All' : statusFilter} · Grades: {selectedGrades.length ? selectedGrades.join(' + ') : 'All'} · Result: {resultOptions.find((item) => item.id === resultFilter)?.label || 'All results'}</span>
            </div>

            <div class="gameList">
                <div class="gameColumnHead" aria-hidden="true">
                    <span>GAME / KICKOFF</span>
                    <span>PROJECTED SCORE</span>
                    <span>MODEL PICK</span>
                    <span>MODEL CLV</span>
                    <span>RATING</span>
                </div>

                {#if filtered.length === 0}
                    <div class="emptyState">
                        <strong>No games match these filters.</strong>
                        <p>Try another signal, grade, graded-result status, or search term.</p>
                        <button type="button" on:click={clearBoardFilters}>Clear filters</button>
                    </div>
                {:else}
                    {#each shownGames as game (game.id)}
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
                                    <strong>{number(boardAwayScore(game))} <span>–</span> {number(boardHomeScore(game))}</strong>
                                    <small>Away / Home</small>
                                </div>
                                <div class="pickCol">
                                    <strong>{boardPick(game) || 'No pick'}</strong>
                                    {#if game.status === 'WATCH' && pickParts(boardPick(game))}
                                        <div class="watchInline" aria-label="WATCH spread improvement targets">
                                            {#each watchImprovementSteps as improvement}
                                                <span>+{improvement}: <strong>{spreadLabel(pickParts(boardPick(game)).spread + improvement)}</strong></span>
                                            {/each}
                                        </div>
                                    {/if}
                                    {#if game.v3Result && game.actualAway != null && game.actualHome != null}
                                        <small class:resultWin={game.v3Result === 'WIN'} class:resultLoss={game.v3Result === 'LOSS'}>V3 {game.v3Result}</small>
                                    {:else}
                                        {#if useV9(game)}
                                            <small>{game.v9.bestBook || 'Snapshot'} · Nov 13 · V9</small>
                                        {:else}
                                            <small>Archived V3 reference</small>
                                        {/if}
                                    {/if}
                                </div>
                                <div class="edgeCol">
                                    <strong>{boardEdge(game) == null ? '—' : (boardEdge(game) >= 0 ? '+' : '') + number(boardEdge(game), 3)}</strong>
                                    <small>points</small>
                                </div>
                                <div class="ratingCol">
                                    <span class="signal" class:isBet={game.status === 'BET'} class:isWatch={game.status === 'WATCH'} class:isPass={game.status === 'PASS'}>{game.status}</span>
                                    <small>Tier {game.tier}{useV9(game) ? ' · V9' : ''}</small>
                                    <span class="expandArrow" aria-hidden="true">⌄</span>
                                </div>
                            </summary>

                            <div class="gameDetails">
                                {#if game.status === 'WATCH' && pickParts(boardPick(game))}
                                    <div class="watchLines">
                                        <div class="watchLinesHeading">
                                            <strong>WATCH · line improvement targets</strong>
                                            <span>Snapshot reference: {boardPick(game)}</span>
                                        </div>
                                        <div class="watchTargets">
                                            {#each watchImprovementSteps as improvement}
                                                <div class="watchTarget" class:targetReached={lineImprovement(game) != null && lineImprovement(game) >= improvement}>
                                                    <span>+{improvement} pts better</span>
                                                    <strong>{targetLine(game, improvement)}</strong>
                                                </div>
                                            {/each}
                                        </div>
                                        <label class="watchQuote">
                                            <span>Sportsbook line for {pickParts(boardPick(game)).team} (optional)</span>
                                            <input type="number" step="0.5" placeholder="Enter signed spread" value={watchLiveLines[game.id] ?? ''} on:input={(event) => setWatchLine(game.id, event.currentTarget.value)} />
                                        </label>
                                        {#if lineImprovement(game) != null}
                                            <div class="watchComparison">
                                                {#if lineImprovement(game) >= 7}
                                                    Meets +3, +5 and +7 improvement targets
                                                {:else if lineImprovement(game) >= 5}
                                                    Meets +3 and +5 improvement targets
                                                {:else if lineImprovement(game) >= 3}
                                                    Meets +3 improvement target
                                                {:else}
                                                    Below +3 improvement target
                                                {/if}
                                

                                                · {spreadLabel(lineImprovement(game))} pts vs reference
                                            </div>
                                        {/if}
                                        <p class="watchDisclaimer">Targets are hypothetical spreads, not live sportsbook quotes. Enter a verified line to compare it against the V3 reference. Better means more points on the selected side, regardless of favorite or underdog. Entries are not saved or included in graded results or ROI.</p>
                                    </div>
                                {/if}
                                <div class="detailPrimary">
                                    <h3>Why {game.status.toLowerCase()}?</h3>
                                    <p>{game.reason}</p>
                                    {#if useV9(game)}
                                        <div class="lineNotice">
                                            <strong>V9 snapshot:</strong> {boardPick(game)} · {game.v9.bestBook || 'Book not specified'} · {game.v9.snapshotUtc}.
                                            Predicted CLV: {number(game.v9.predictedEdge, 3)} points.
                                            {#if game.v9.h3CleanProspective} H3 clean-prospective flag.{/if}
                                            <span>Archived V3 reference: {game.v3Pick}.</span>
                                        </div>
                                    {:else if game.referenceLineOnly}
                                        <div class="lineNotice">This is a nonstandard V3 model reference. Verify a sportsbook quote before betting.</div>
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
                                    <div><span>Archived V3 raw pick</span><strong>{game.rawPick || '—'}</strong></div>
                                    <div><span>Raw model edge</span><strong>{number(game.rawEdge, 2)} pts</strong></div>
                                    <div><span>Calibrated pick</span><strong>{game.calPick || '—'}</strong></div>
                                    <div><span>Calibrated edge</span><strong>{number(game.calEdge, 2)} pts</strong></div>
                                    <div><span>Archived V3 production</span><strong>{game.v3Production ? 'Yes' : 'No'}</strong></div>
                                    <div><span>H3 / S1</span><strong>{game.H3 ? 'H3' : '—'} / {game.S1 ? 'S1' : '—'}</strong></div>
                                    <div><span>Source</span><strong>{useV9(game) ? 'V9 Nov 13 snapshot' : game.sourceType || 'Unknown'}</strong></div>
                                </div>
                            </div>
                        </details>
                    {/each}
                {/if}
            </div>
            {#if shownGames.length < filtered.length}
                <div class="loadMore">
                    <button type="button" on:click={() => visibleLimit += 20}>
                        Show 20 more games ({filtered.length - shownGames.length} remaining)
                    </button>
                </div>
            {/if}
            <p class="filterHelp">The result filter shows recorded V3 model-side outcomes (WIN, LOSS, PUSH). Ungraded includes games without a recorded result, even if kickoff has passed. It changes the visible game board, not the historical ROI calculation.</p>
            <p class="filterHelp">WATCH +3 / +5 / +7 targets are hypothetical improvements relative to the displayed line: the November 13 V9 snapshot for Week 11, and archived V3 for older weeks. Expand to compare your current sportsbook quote.</p>
            <p class="underBoard">Projected score lists away first. Week 11 V9 book quotes come from the November 13 snapshot and may have moved. Predicted CLV is modeled line movement, not cover probability. BET is a model signal, not a confirmed placed wager. Historical grading and ROI remain V3.</p>
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
                                            <td><a href={archiveHref(board.season, item.week)}>Week {item.week}</a></td>
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
                                            <td><a href={archiveHref(item.season, null)}>{item.season}</a></td>
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
            <p><strong>Record filters:</strong> signal and selected grades are applied together, alongside the chosen performance strategy. Changing grade selections affects both the game board and the records; grades may be combined freely.</p>
            <p><strong>Model results ≠ actual bets.</strong> W–L–P uses recorded V3 model-side outcomes. Win rate excludes pushes; ungraded games are excluded from W–L–P and ROI. Net units and ROI are hypothetical flat-stake returns at assumed -110 odds; neither actual betting prices nor historical bookability is verified. Historical 2023–2025 grades are reconstructed, not verified pregame bets, and 2022 covers only Weeks 9–15.</p>
            <p>BET/WATCH/PASS tiers summarize model qualifications, <strong>not calibrated probabilities</strong>. The combined BET + WATCH record includes each matching game once and excludes PASS. The archive uses its original week labels, including some postseason-dated games grouped into historical Week 1. Data source: {board.sourceFile}.</p>
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
    .globalFilters { margin-top: 1rem; padding: 1.1rem 1.25rem; border: 1px solid var(--subtleBorder); border-radius: .85rem; background: var(--surface); }
    .filterHead { display: flex; align-items: start; justify-content: space-between; gap: 1rem; }
    .filterHead p { margin: .25rem 0 .9rem; font-size: .77rem; opacity: .72; }
    .resetFilters { background: transparent; color: var(--accent); border: 0; padding: .25rem; cursor: pointer; font: inherit; font-size: .76rem; font-weight: 800; white-space: nowrap; }
    .filterGroup + .filterGroup { margin-top: 1.05rem; padding-top: .85rem; border-top: 1px solid var(--subtleBorder); }
    .filterRowTitle { display: flex; flex-wrap: wrap; align-items: baseline; gap: .5rem; margin-bottom: .55rem; }
    .filterRowTitle strong { font-size: .83rem; }
    .filterRowTitle > span { font-size: .68rem; opacity: .67; }
    .filterTabs { display: flex; gap: .5rem; flex-wrap: wrap; margin-bottom: 0; }
    .filterTabs button { padding: .7rem .9rem; background: var(--surface); color: var(--000); border: 1px solid var(--subtleBorder); border-radius: .55rem; display: flex; align-items: center; gap: .55rem; font-size: .8rem; font-weight: 800; cursor: pointer; }
    .filterTabs button:hover { border-color: var(--accent); }
    .filterTabs button.tabActive { border-color: var(--accent); box-shadow: inset 0 -2px var(--accent); }
    .tabCount { border-radius: .4rem; padding: .1rem .38rem; background: var(--surfaceMuted); font-size: .73rem; font-variant-numeric: tabular-nums; }
    .gradeControls { display: flex; flex-wrap: wrap; align-items: center; gap: .45rem; }
    .gradeButton { display: inline-flex; gap: .65rem; justify-content: space-between; align-items: center; border: 1px solid var(--subtleBorder); border-radius: .5rem; background: var(--surface); color: var(--000); padding: .65rem .85rem; cursor: pointer; font-size: .77rem; font-weight: 800; }
    .gradeButton:hover { border-color: var(--accent); }
    .gradeButton.gradeActive { border-color: var(--accent); box-shadow: inset 0 -2px var(--accent); }
    .gradeCount { background: var(--surfaceMuted); border-radius: .35rem; padding: .08rem .3rem; font-size: .69rem; font-variant-numeric: tabular-nums; }
    .clearGrade { border: 0; color: var(--accent); background: transparent; font: inherit; font-size: .74rem; font-weight: 800; padding: .5rem; cursor: pointer; }
    .filterHelp { font-size: .69rem; line-height: 1.5; opacity: .65; margin: .55rem 0 0; }
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
    .watchInline { display: flex; flex-wrap: wrap; gap: .25rem .38rem; margin-top: .4rem; }
    .watchInline span { display: inline-flex; align-items: baseline; gap: .16rem; font-size: .64rem; font-variant-numeric: tabular-nums; border: 1px solid var(--subtleBorder); background: var(--surfaceMuted); border-radius: .26rem; padding: .17rem .3rem; white-space: nowrap; }
    .watchInline strong { font-size: inherit; display: inline; }
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
    .watchLines { grid-column: 1 / -1; border: 1px solid var(--subtleBorder); background: var(--surfaceMuted); padding: 1rem; border-radius: .65rem; }
    .watchLinesHeading { display: flex; align-items: baseline; justify-content: space-between; gap: .5rem; flex-wrap: wrap; font-size: .82rem; margin-bottom: .65rem; }
    .watchLinesHeading span { opacity: .7; font-size: .7rem; }
    .watchTargets { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: .5rem; }
    .watchTarget { display: flex; flex-direction: column; gap: .3rem; background: var(--surface); border: 1px solid var(--subtleBorder); padding: .65rem; border-radius: .45rem; }
    .watchTarget span { font-size: .66rem; opacity: .75; }
    .watchTarget strong { font-size: .88rem; font-variant-numeric: tabular-nums; }
    .watchTarget.targetReached { border-color: #26865b; }
    .watchQuote { display: flex; align-items: center; flex-wrap: wrap; gap: .65rem; margin-top: .7rem; font-size: .73rem; }
    .watchQuote input { padding: .45rem .65rem; width: 150px; }
    .watchComparison { font-size: .75rem; font-weight: 800; margin-top: .65rem; }
    .watchDisclaimer { font-size: .67rem !important; line-height: 1.5; opacity: .7; margin: .7rem 0 0 !important; }
    .lineNotice { padding: .65rem .8rem; border-left: 3px solid #ce9a3b; font-size: .75rem; line-height: 1.5; margin-bottom: .9rem; }
    .finalScore { display: flex; align-items: baseline; flex-wrap: wrap; column-gap: .6rem; row-gap: .3rem; margin-bottom: .85rem; }
    .finalScore > span { font-size: .62rem; opacity: .65; }
    .finalScore > strong { font-size: .8rem; }
    .tagGroup { display: flex; flex-wrap: wrap; gap: .3rem; }
    .tagGroup span { font-size: .59rem; border: 1px solid var(--subtleBorder); border-radius: .3rem; padding: .22rem .35rem; opacity: .7; overflow-wrap: anywhere; }
    .loadMore { padding: 1rem; display: flex; justify-content: center; border-top: 1px solid var(--subtleBorder); }
    .loadMore button { border: 1px solid var(--accent); border-radius: .5rem; background: var(--surface); color: var(--000); padding: .75rem 1.1rem; font: inherit; font-size: .82rem; font-weight: 800; cursor: pointer; }
    .loadMore button:hover { background: var(--surfaceMuted); }
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
        .watchTargets { grid-template-columns: 1fr; }
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
        .globalFilters { padding: 1rem; }
        .filterTabs { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .filterTabs button, .gradeButton { justify-content: space-between; }
        .gradeControls { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .clearGrade { grid-column: 1 / -1; text-align: left; }
        .boardTools { flex-direction: column; }
        .searchField, .sortField, .sortField select { width: 100%; box-sizing: border-box; }
        .boardLegend { flex-direction: column; align-items: start; }
        .seasonBar { padding: 1rem; }
        .weekArrows button { width: 33px; }
        .seasonControls { gap: .35rem; }
    }
</style>
