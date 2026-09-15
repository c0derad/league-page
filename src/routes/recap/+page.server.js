import {
    getLeagueTeamManagers,
    loadPlayers
} from '$lib/utils/helper';

import {
    leagueID
} from '$lib/utils/leagueInfo';

import {
    getWeeklyNFLStats
} from '$lib/utils/nflStats.server';

export async function load({
    url,
    fetch
}) {
    const nflStateResponse =
        await fetch(
            'https://api.sleeper.app/v1/state/nfl'
        );

    if (!nflStateResponse.ok) {
        throw new Error(
            `Unable to load Sleeper NFL state: ${nflStateResponse.status}`
        );
    }

    const nflState =
        await nflStateResponse.json();

    /*
     * Sleeper's current week is the week being played / upcoming.
     * Therefore the previous week is the latest completed recap.
     *
     * Example:
     * Sleeper current week = 2
     * Latest completed recap = Week 1
     */
    const maxRecapWeek =
        Math.max(
            1,
            Number(nflState.week || 1) - 1
        );

    const requestedWeek =
        Number(
            url.searchParams.get(
                'week'
            )
        );

    /*
     * If no week is supplied, open the latest completed recap.
     *
     * Also prevents someone from manually requesting a future
     * recap such as /recap?week=12 during Week 3.
     */
    const queryWeek =
        requestedWeek
            ? Math.min(
                Math.max(
                    requestedWeek,
                    1
                ),
                maxRecapWeek
            )
            : maxRecapWeek;

    const [
        matchupResponse,
        nextMatchupResponse
    ] = await Promise.all([
        fetch(
            `https://api.sleeper.app/v1/league/${leagueID}/matchups/${queryWeek}`
        ),

        fetch(
            `https://api.sleeper.app/v1/league/${leagueID}/matchups/${queryWeek + 1}`
        )
    ]);

    if (!matchupResponse.ok) {
        throw new Error(
            `Unable to load Sleeper Week ${queryWeek} matchups: ${matchupResponse.status}`
        );
    }

    if (!nextMatchupResponse.ok) {
        throw new Error(
            `Unable to load Sleeper Week ${queryWeek + 1} matchups: ${nextMatchupResponse.status}`
        );
    }

    const [
        rawMatchups,
        nextRawMatchups
    ] = await Promise.all([
        matchupResponse.json(),
        nextMatchupResponse.json()
    ]);

    const nflStats =
        await getWeeklyNFLStats(
            fetch,
            queryWeek
        );

    return {
        week:
            queryWeek,

        maxRecapWeek,

        rawMatchups,

        nextRawMatchups,

        nflStats,

        leagueTeamManagersData:
            getLeagueTeamManagers(),

        playersData:
            loadPlayers(fetch)
    };
}
