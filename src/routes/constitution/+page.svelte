<script>
    import { dues, leagueName } from '$lib/utils/leagueInfo';

    const scrollToSection = (id) => {
        document.getElementById(id)?.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    };
</script>

<svelte:head>
    <title>Constitution | {leagueName}</title>
</svelte:head>

<style>
    .constitution {
        width: 92%;
        max-width: 900px;
        margin: 0 auto;
        padding: 3em 0 6em;
        color: var(--g555);
    }

    .title {
        text-align: center;
        margin-bottom: 0.5em;
        font-size: 2.8em;
        line-height: 1.05em;
    }

    .subtitle {
        text-align: center;
        color: #888;
        font-style: italic;
        margin-bottom: 3em;
    }

    .toc {
        border: 1px solid var(--ccc);
        border-radius: 1em;
        padding: 1.5em 2em;
        margin: 0 auto 4em;
        background: var(--fff);
        box-shadow: 0 0 6px 0 var(--bbb);
    }

    .toc h2 {
        margin-top: 0;
        text-align: center;
    }

    .tocGrid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0.5em 2em;
    }

    .tocButton {
        display: block;
        width: 100%;
        border: 0;
        background: none;
        color: var(--g555);
        font: inherit;
        text-align: left;
        cursor: pointer;
        padding: 0.35em 0;
    }

    .tocButton:hover {
        text-decoration: underline;
    }

    .article {
        scroll-margin-top: 5em;
        margin: 4em 0;
    }

    .article h2 {
        border-bottom: 2px solid var(--ccc);
        padding-bottom: 0.35em;
        margin-bottom: 1.5em;
    }

    .section {
        scroll-margin-top: 5em;
        margin: 2em 0;
    }

    .section h3 {
        margin-bottom: 0.6em;
    }

    p {
        line-height: 1.6em;
    }

    ul,
    ol {
        line-height: 1.7em;
        padding-left: 2em;
    }

    li {
        margin: 0.35em 0;
    }

    .payoutTable {
        width: 100%;
        max-width: 500px;
        margin: 1.5em auto;
        border-collapse: collapse;
    }

    .payoutTable th,
    .payoutTable td {
        border: 1px solid var(--ccc);
        padding: 0.8em 1em;
        text-align: left;
    }

    .payoutTable th {
        font-weight: 700;
    }

    .payoutTable td:last-child,
    .payoutTable th:last-child {
        text-align: right;
    }

    .ruleBox {
        border-left: 4px solid var(--blueTwo);
        padding: 0.8em 1.2em;
        margin: 1.5em 0;
        background-color: var(--eee);
    }

    .warningBox {
        border: 1px solid var(--ccc);
        border-radius: 0.75em;
        padding: 1em 1.25em;
        margin: 1.5em 0;
    }

    .czar {
        text-align: center;
        margin-top: 5em;
        font-weight: 700;
        font-style: italic;
    }

    @media (max-width: 650px) {
        .constitution {
            width: 94%;
            padding-top: 2em;
        }

        .title {
            font-size: 2.2em;
        }

        .tocGrid {
            grid-template-columns: 1fr;
        }

        .toc {
            padding: 1.25em;
        }
    }
</style>

<div class="constitution">
    <h1 class="title">{leagueName} Constitution</h1>

    <div class="subtitle">
        The laws of the land, subject to enforcement by the Roster Czar.
    </div>

    <!-- TABLE OF CONTENTS -->
    <div class="toc">
        <h2>Table of Contents</h2>

        <div class="tocGrid">
            <div>
                <button
                    type="button"
                    class="tocButton"
                    onclick={() => scrollToSection('article-one')}
                >
                    Article I — League Structure
                </button>

                <button
                    type="button"
                    class="tocButton"
                    onclick={() => scrollToSection('article-two')}
                >
                    Article II — Rosters & Lineups
                </button>

                <button
                    type="button"
                    class="tocButton"
                    onclick={() => scrollToSection('article-three')}
                >
                    Article III — Competition
                </button>

                <button
                    type="button"
                    class="tocButton"
                    onclick={() => scrollToSection('article-four')}
                >
                    Article IV — Trades & Transactions
                </button>

                <button
                    type="button"
                    class="tocButton"
                    onclick={() => scrollToSection('article-five')}
                >
                    Article V — Low Man
                </button>
            </div>

            <div>
                <button
                    type="button"
                    class="tocButton"
                    onclick={() => scrollToSection('article-six')}
                >
                    Article VI — Co-Managers
                </button>

                <button
                    type="button"
                    class="tocButton"
                    onclick={() => scrollToSection('article-seven')}
                >
                    Article VII — Dues & Payouts
                </button>

                <button
                    type="button"
                    class="tocButton"
                    onclick={() => scrollToSection('article-eight')}
                >
                    Article VIII — Last Place
                </button>

                <button
                    type="button"
                    class="tocButton"
                    onclick={() => scrollToSection('article-nine')}
                >
                    Article IX — Roster Czar
                </button>

                <button
                    type="button"
                    class="tocButton"
                    onclick={() => scrollToSection('article-ten')}
                >
                    Article X — Rule Changes
                </button>
            </div>
        </div>
    </div>

    <!-- ARTICLE I -->
    <section class="article" id="article-one">
        <h2>Article I — League Structure</h2>

        <div class="section">
            <h3>1.1 League Format</h3>

            <p>
                TouchDown Syndrome is a 12-roster, season-long redraft fantasy
                football league hosted on Sleeper.
            </p>

            <p>
                Sleeper shall serve as the official source of truth for the
                league's active scoring settings, roster positions, schedule,
                standings, playoff configuration, waiver settings, and other
                platform-controlled league settings.
            </p>
        </div>

        <div class="section">
            <h3>1.2 League Membership</h3>

            <p>
                A roster may be managed by one manager or by approved
                co-managers. Co-managed teams remain a single fantasy roster,
                but each co-manager is treated as an individual league member
                for dues and punishment purposes.
            </p>
        </div>

        <div class="section">
            <h3>1.3 Good-Faith Competition</h3>

            <p>
                Every manager is expected to make a good-faith effort to field
                a competitive lineup and participate throughout the season.
                Deliberate conduct intended to compromise competitive integrity
                may be addressed by the Roster Czar under Article IX.
            </p>
        </div>
    </section>

    <!-- ARTICLE II -->
    <section class="article" id="article-two">
        <h2>Article II — Rosters & Lineups</h2>

        <div class="section">
            <h3>2.1 Official Lineups</h3>

            <p>
                Starting lineups and roster eligibility shall follow the
                settings displayed in Sleeper for the current season.
            </p>
        </div>

        <div class="section">
            <h3>2.2 Manager Responsibility</h3>

            <p>
                Each manager is responsible for maintaining his own roster,
                setting his lineup, monitoring player availability, and
                accounting for injuries, suspensions, bye weeks, and other
                relevant circumstances.
            </p>
        </div>

        <div class="section">
            <h3>2.3 Locked Players</h3>

            <p>
                Once a player's applicable NFL game has begun, that player's
                lineup status is governed by Sleeper's normal lock rules unless
                a separate league punishment has resulted in a broader roster
                lock.
            </p>
        </div>
    </section>

    <!-- ARTICLE III -->
    <section class="article" id="article-three">
        <h2>Article III — Competition</h2>

        <div class="section">
            <h3>3.1 Regular Season</h3>

            <p>
                Regular-season standings, matchup results, points scored,
                tiebreakers, and playoff qualification shall be determined
                according to the active Sleeper league settings.
            </p>
        </div>

        <div class="section">
            <h3>3.2 Playoffs</h3>

            <p>
                Playoff seeding, qualification, matchup structure, and scoring
                shall follow the league settings established in Sleeper for the
                applicable season.
            </p>
        </div>

        <div class="section">
            <h3>3.3 Lineup Integrity</h3>

            <p>
                Managers may make poor decisions. Managers may make catastrophically
                poor decisions. Stupidity alone is not a rules violation.
            </p>

            <p>
                Deliberately submitting an illegitimate lineup for the purpose
                of manipulating another team's standings, playoff position, or
                competitive outcome may constitute a competitive-integrity
                violation.
            </p>
        </div>
    </section>

    <!-- ARTICLE IV -->
    <section class="article" id="article-four">
        <h2>Article IV — Trades & Transactions</h2>

        <div class="section">
            <h3>4.1 Managerial Freedom</h3>

            <p>
                Managers are free to value players however they choose. A trade
                will not be overturned merely because members of the league
                believe that it is uneven, reckless, stupid, shortsighted, or
                otherwise offensive to basic football intelligence.
            </p>
        </div>

        <div class="section">
            <h3>4.2 Trade Review</h3>

            <p>
                There shall be no routine league vote to veto trades.
            </p>

            <p>
                The Roster Czar may investigate and, where necessary, reverse or
                block a transaction when credible evidence exists of:
            </p>

            <ul>
                <li>Collusion between managers;</li>
                <li>Intentional roster dumping;</li>
                <li>
                    Payment, compensation, favors, or other consideration
                    outside the fantasy league;
                </li>
                <li>
                    An agreement primarily designed to manipulate standings,
                    playoff qualification, or competitive integrity;
                </li>
                <li>
                    A genuine accidental transaction promptly acknowledged by
                    all managers involved.
                </li>
            </ul>
        </div>

        <div class="section">
            <h3>4.3 Waivers and Free Agency</h3>

            <p>
                Waivers, free-agent acquisitions, FAAB procedures, waiver
                priority, and transaction deadlines shall follow the current
                Sleeper league settings.
            </p>
        </div>
    </section>

    <!-- ARTICLE V -->
    <section class="article" id="article-five">
        <h2>Article V — The Low Man</h2>

        <div class="section">
            <h3>5.1 Designation</h3>

            <p>
                Following each completed fantasy week, the manager whose
                starting lineup records the fewest fantasy points shall be
                designated the <strong>Low Man</strong>.
            </p>
        </div>

        <div class="section">
            <h3>5.2 Press Conference</h3>

            <p>
                The Low Man must record and submit a video press conference to
                the league group chat.
            </p>

            <p>The press conference must address, at minimum:</p>

            <ul>
                <li>The team's performance during the previous week;</li>
                <li>What went wrong;</li>
                <li>
                    Relevant managerial decisions, player performances, or
                    failures;
                </li>
                <li>The outlook for the roster moving forward.</li>
            </ul>
        </div>

        <div class="section">
            <h3>5.3 Mandatory Finish</h3>

            <p>
                The press conference must conclude with the Low Man chugging or
                shotgunning one full beer.
            </p>
        </div>

        <div class="section">
            <h3>5.4 Deadline</h3>

            <div class="ruleBox">
                The completed Low Man press conference must be sent to the
                league group chat before kickoff of the following Thursday
                Night Football game.
            </div>

            <p>
                If there is no Thursday Night Football game during the following
                scoring week, the deadline shall be kickoff of the first NFL
                game of that scoring week.
            </p>
        </div>

        <div class="section">
            <h3>5.5 Failure to Complete</h3>

            <p>
                If the Low Man fails to submit the required press conference by
                the applicable deadline, his roster and lineup shall be locked.
            </p>

            <p>
                The lock may prevent lineup changes, adds, drops, waivers,
                trades, or other roster management as necessary to enforce the
                punishment.
            </p>

            <p>
                The roster shall remain subject to enforcement until the
                required Low Man punishment has been completed.
            </p>
        </div>

        <div class="section">
            <h3>5.6 Co-Managed Low Man</h3>

            <p>
                If a co-managed roster finishes as Low Man, each co-manager
                must independently complete the full punishment.
            </p>

            <div class="ruleBox">
                Two managers means two press conferences and two beer
                chugs/shotguns. One manager may not complete the punishment on
                behalf of the other.
            </div>
        </div>
    </section>

    <!-- ARTICLE VI -->
    <section class="article" id="article-six">
        <h2>Article VI — Co-Managed Teams</h2>

        <div class="section">
            <h3>6.1 Co-Management</h3>

            <p>
                Co-managed teams are permitted with league approval.
            </p>

            <p>
                Co-managers jointly control one Sleeper roster but remain
                individually responsible for their financial and punishment
                obligations to the league.
            </p>
        </div>

        <div class="section">
            <h3>6.2 Dues</h3>

            <p>
                Each co-manager owes the full league buy-in. The buy-in is not
                divided between co-managers.
            </p>

            <p>
                At the current annual rate of ${dues}, a two-person co-managed
                roster therefore contributes ${dues * 2} to the league prize
                pool.
            </p>
        </div>

        <div class="section">
            <h3>6.3 Punishments</h3>

            <p>
                Punishments apply independently to each co-manager.
            </p>

            <p>
                Any weekly or season-long punishment earned by a co-managed
                roster must be performed in full by every manager of that
                roster.
            </p>
        </div>

        <div class="section">
            <h3>6.4 Responsibility</h3>

            <p>
                Internal disagreement between co-managers does not excuse a
                missed lineup, transaction error, punishment, payment, or other
                league obligation.
            </p>
        </div>
    </section>

    <!-- ARTICLE VII -->
    <section class="article" id="article-seven">
        <h2>Article VII — League Dues & Payouts</h2>

        <div class="section">
            <h3>7.1 League Dues</h3>

            <p>
                The annual league buy-in is <strong>${dues} per manager</strong>.
            </p>

            <p>
                With 12 rosters and one two-person co-managed team, the current
                league consists of 13 paying managers, producing a total annual
                prize pool of <strong>$1,300</strong>.
            </p>
        </div>

        <div class="section">
            <h3>7.2 Payout</h3>

            <table class="payoutTable">
                <thead>
                    <tr>
                        <th>Finish</th>
                        <th>Payout</th>
                    </tr>
                </thead>

                <tbody>
                    <tr>
                        <td>League Champion</td>
                        <td><strong>$800</strong></td>
                    </tr>

                    <tr>
                        <td>2nd Place</td>
                        <td><strong>$350</strong></td>
                    </tr>

                    <tr>
                        <td>3rd Place</td>
                        <td><strong>$150</strong></td>
                    </tr>

                    <tr>
                        <td><strong>Total</strong></td>
                        <td><strong>$1,300</strong></td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div class="section">
            <h3>7.3 Raising Dues</h3>

            <p>
                Any change to league dues must be announced before the season
                in which the new amount will take effect.
            </p>

            <p>
                Co-manager dues shall continue to be assessed on a per-manager
                basis unless the league expressly adopts a different rule.
            </p>
        </div>
    </section>

    <!-- ARTICLE VIII -->
    <section class="article" id="article-eight">
        <h2>Article VIII — Last-Place Punishment</h2>

        <div class="section">
            <h3>8.1 Annual Punishment</h3>

            <p>
                TouchDown Syndrome shall maintain an annual end-of-season
                punishment for last place.
            </p>
        </div>

        <div class="section">
            <h3>8.2 2026 Punishment</h3>

            <div class="warningBox">
                <strong>TBD.</strong> The specific 2026 last-place punishment
                has not yet been finalized.
            </div>
        </div>

        <div class="section">
            <h3>8.3 Co-Managers</h3>

            <p>
                Unless the league expressly determines otherwise when adopting
                the specific punishment, a last-place punishment earned by a
                co-managed roster shall apply independently and in full to each
                co-manager.
            </p>
        </div>
    </section>

    <!-- ARTICLE IX -->
    <section class="article" id="article-nine">
        <h2>Article IX — The Roster Czar</h2>

        <div class="section">
            <h3>9.1 Administration</h3>

            <p>
                The Roster Czar serves as commissioner and is responsible for
                administering the league, maintaining league settings,
                enforcing written rules, and resolving technical or procedural
                issues.
            </p>
        </div>

        <div class="section">
            <h3>9.2 Competitive Integrity</h3>

            <p>
                The Roster Czar may take reasonable action necessary to enforce
                this Constitution and preserve competitive integrity,
                including enforcement of Low Man roster locks and review of
                potentially collusive transactions.
            </p>
        </div>

        <div class="section">
            <h3>9.3 Limits of Authority</h3>

            <p>
                Commissioner status does not authorize the Roster Czar to alter
                scoring, matchup results, rosters, waiver outcomes, or league
                rules for personal competitive advantage.
            </p>
        </div>

        <div class="section">
            <h3>9.4 Unanticipated Issues</h3>

            <p>
                Where a situation is not addressed by this Constitution or the
                Sleeper settings, the Roster Czar may issue a reasonable ruling
                consistent with past league practice, competitive integrity,
                and the spirit of the league.
            </p>
        </div>
    </section>

    <!-- ARTICLE X -->
    <section class="article" id="article-ten">
        <h2>Article X — Rule Changes</h2>

        <div class="section">
            <h3>10.1 Material Rule Changes</h3>

            <p>
                Material changes to dues, payouts, scoring, roster construction,
                playoff qualification, or season-long punishments should be
                announced before taking effect.
            </p>
        </div>

        <div class="section">
            <h3>10.2 Administrative Changes</h3>

            <p>
                The Roster Czar may make non-material administrative,
                technical, formatting, or clarification changes when necessary
                to operate the league or maintain this Constitution.
            </p>
        </div>

        <div class="section">
            <h3>10.3 Sleeper Settings</h3>

            <p>
                Where this Constitution references a configurable football
                setting without specifying a separate league rule, the current
                Sleeper configuration shall control.
            </p>
        </div>
    </section>

    <div class="czar">
        Long live the Czar.
    </div>
</div>
