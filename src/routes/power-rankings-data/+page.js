import {
    getLeagueRosters,
    getLeagueTeamManagers,
    loadPlayers
} from '$lib/utils/helper';

import {
    leagueID
} from '$lib/utils/leagueInfo';

export async function load({
    fetch,
    url
}) {
    const queryWeek =
        Number(
            url.searchParams.get(
                'week'
            )
        );

    /*
        Defaulting to Week 6 right now.

        Going forward, just use:
        /power-rankings-data?week=7
        /power-rankings-data?week=8
        etc.
    */
    const week =
        Number.isInteger(
            queryWeek
        ) &&
        queryWeek >= 1 &&
        queryWeek <= 18
            ? queryWeek
            : 6;

    const previousWeek =
        Math.max(
            0,
            week - 1
        );

    /*
        Pull every matchup week through
        the requested week.

        We need the old weeks to calculate
        the team's record entering the
        requested week.
    */
    const matchupWeeks =
        Array.from(
            {
                length: week
            },
            (
                _,
                index
            ) =>
                index + 1
        );

    /*
        Sleeper can classify transactions
        under either the previous leg or
        current leg.

        Pull both so we don't miss moves
        made between fantasy weeks.
    */
    const transactionWeeks =
        [
            previousWeek,
            week
        ]
            .filter(
                (value) =>
                    value >= 1
            )
            .filter(
                (
                    value,
                    index,
                    array
                ) =>
                    array.indexOf(
                        value
                    ) === index
            );

    const [
        rosterData,
        managerData,
        playersData,
        matchupResults,
        transactionResults
    ] =
        await Promise.all([
            getLeagueRosters(),

            getLeagueTeamManagers(),

            loadPlayers(fetch),

            Promise.all(
                matchupWeeks.map(
                    async (
                        matchupWeek
                    ) => {
                        const response =
                            await fetch(
                                `https://api.sleeper.app/v1/league/${leagueID}/matchups/${matchupWeek}`
                            );

                        const matchups =
                            await response.json();

                        return {
                            week:
                                matchupWeek,

                            matchups:
                                Array.isArray(
                                    matchups
                                )
                                    ? matchups
                                    : []
                        };
                    }
                )
            ),

            Promise.all(
                transactionWeeks.map(
                    async (
                        transactionWeek
                    ) => {
                        const response =
                            await fetch(
                                `https://api.sleeper.app/v1/league/${leagueID}/transactions/${transactionWeek}`
                            );

                        const transactions =
                            await response.json();

                        return {
                            week:
                                transactionWeek,

                            transactions:
                                Array.isArray(
                                    transactions
                                )
                                    ? transactions
                                    : []
                        };
                    }
                )
            )
        ]);

    const rawRosters =
        rosterData?.rosters ??
        rosterData ??
        [];

    const currentRosters =
        Array.isArray(
            rawRosters
        )
            ? rawRosters
            : Object.values(
                rawRosters
            );

    const players =
        playersData?.players ??
        playersData ??
        {};

    const rawManagers =
        managerData
            ?.teamManagers ??
        managerData
            ?.leagueTeamManagers ??
        managerData
            ?.managers ??
        managerData ??
        [];

    const teamManagers =
        Array.isArray(
            rawManagers
        )
            ? rawManagers
            : Object.values(
                rawManagers
            );

    const matchupsByWeek =
        {};

    for (
        const result
        of matchupResults
    ) {
        matchupsByWeek[
            result.week
        ] =
            result.matchups;
    }

    /*
        Flatten both transaction legs.

        De-dupe by Sleeper transaction ID
        because occasionally the same move
        can appear in overlapping pulls.
    */
    const transactionMap =
        new Map();

    for (
        const result
        of transactionResults
    ) {
        for (
            const transaction
            of result.transactions
        ) {
            const transactionID =
                transaction
                    ?.transaction_id;

            if (!transactionID) {
                continue;
            }

            transactionMap.set(
                transactionID,
                transaction
            );
        }
    }

    const transactions =
        [
            ...transactionMap.values()
        ];

    return {
        week,
        previousWeek,

        currentRosters,
        teamManagers,
        players,

        matchupsByWeek,

        transactions
    };
}
