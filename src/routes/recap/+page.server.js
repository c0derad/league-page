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
    const queryWeek =
        Number(
            url.searchParams.get(
                'week'
            )
        ) || 1;

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

        rawMatchups,

        nextRawMatchups,

        nflStats,

        leagueTeamManagersData:
            getLeagueTeamManagers(),

        playersData:
            loadPlayers(fetch)
    };
}
