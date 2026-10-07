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
        week3Transactions,
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
            `https://api.sleeper.app/v1/league/${leagueID}/transactions/3`
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

    const transactions3 =
        Array.isArray(week3Transactions)
            ? week3Transactions
            : [];

    const transactions4 =
        Array.isArray(week4Transactions)
            ? week4Transactions
            : [];

    const transactions5 =
    Array.isArray(week5Transactions)
        ? week5Transactions
        : [];
    /*
        We intentionally combine Sleeper transaction legs 3 and 4.

        The Week 3 roster snapshot was taken before all of the post-snapshot
        roster movement occurred, and Sleeper can classify transactions
        completed later in the NFL week under transaction leg 3.

        The Svelte export will show transaction.leg for every item, so we can
        distinguish which Sleeper week each transaction belongs to.
    */
    const rankingTransactions = [
        ...transactions3,
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
        week5Matchups

        /*
            Keep this property name because the current +page.svelte already
            reads data.week4Transactions.

            It now contains the transaction window relevant to the Week 4
            rankings: Sleeper transaction legs 3 + 4.
        */
        week5Transactions:
            rankingTransactions,

        week1Snapshot:
            rosterHistory?.["1"] || null,

        week2Snapshot:
            rosterHistory?.["2"] || null,

        week3Snapshot:
            rosterHistory?.["3"] || null

        week4Snapshot:
            rosterHistory?.["4"] || null


};
}
