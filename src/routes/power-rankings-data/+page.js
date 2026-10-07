import {
    getLeagueRosters,
    getLeagueTeamManagers,
    loadPlayers
} from '$lib/utils/helper';

import {
    leagueID
} from '$lib/utils/leagueInfo';

import rosterHistory from '$lib/data/rosterHistory.json';

export async function load({ fetch }) {
    const [
        rosterData,
        managerData,
        playersData,
        week1Matchups,
        week2Matchups,
        week3Matchups,
        week4Matchups,
        week5Matchups,
        week4Transactions,
        week5Transactions
    ] = await Promise.all([
        getLeagueRosters(),
        getLeagueTeamManagers(),
        loadPlayers(fetch),

        fetch(
            `https://api.sleeper.app/v1/league/${leagueID}/matchups/1`
        ).then((r) => r.json()),

        fetch(
            `https://api.sleeper.app/v1/league/${leagueID}/matchups/2`
        ).then((r) => r.json()),

        fetch(
            `https://api.sleeper.app/v1/league/${leagueID}/matchups/3`
        ).then((r) => r.json()),

        fetch(
            `https://api.sleeper.app/v1/league/${leagueID}/matchups/4`
        ).then((r) => r.json()),

        fetch(
            `https://api.sleeper.app/v1/league/${leagueID}/matchups/5`
        ).then((r) => r.json()),

        fetch(
            `https://api.sleeper.app/v1/league/${leagueID}/transactions/4`
        ).then((r) => r.json()),

        fetch(
            `https://api.sleeper.app/v1/league/${leagueID}/transactions/5`
        ).then((r) => r.json())
    ]);

    const rawRosters =
        rosterData?.rosters ??
        rosterData ??
        [];

    const currentRosters =
        Array.isArray(rawRosters)
            ? rawRosters
            : Object.values(rawRosters);

    const players =
        playersData?.players ??
        playersData ??
        {};

    const rawManagers =
        managerData?.teamManagers ??
        managerData?.leagueTeamManagers ??
        managerData?.managers ??
        managerData ??
        [];

    const teamManagers =
        Array.isArray(rawManagers)
            ? rawManagers
            : Object.values(rawManagers);

    const transactions4 =
        Array.isArray(
            week4Transactions
        )
            ? week4Transactions
            : [];

    const transactions5 =
        Array.isArray(
            week5Transactions
        )
            ? week5Transactions
            : [];

    /*
        Week 5 rankings compare the live roster against
        the Week 4 roster snapshot.

        Sleeper can classify post-snapshot roster movement
        under either transaction leg 4 or transaction leg 5.

        We therefore pull both legs for the Week 5 rankings.
        The Svelte export preserves transaction.leg as
        transaction.week so we can still see where Sleeper
        classified each move.
    */
    const rankingTransactions = [
        ...transactions4,
        ...transactions5
    ];

    return {
        currentRosters,
        teamManagers,
        players,

        week1Matchups,
        week2Matchups,
        week3Matchups,
        week4Matchups,
        week5Matchups,

        /*
            Keep this property name aligned with
            the Week 5 +page.svelte.

            It contains transaction legs 4 + 5.
        */
        week5Transactions:
            rankingTransactions,

        week1Snapshot:
            rosterHistory?.["1"] ||
            null,

        week2Snapshot:
            rosterHistory?.["2"] ||
            null,

        week3Snapshot:
            rosterHistory?.["3"] ||
            null,

        week4Snapshot:
            rosterHistory?.["4"] ||
            null
    };
}
