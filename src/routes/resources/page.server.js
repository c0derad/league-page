import {
    getLeagueRosters,
    loadPlayers
} from '$lib/utils/helper';

import {
    leagueID
} from '$lib/utils/leagueInfo';

import rosterHistory from '$lib/data/rosterHistory.json';

export async function load({ fetch }) {
    const [
        rosterInfo,
        playersInfo,
        week1Matchups,
        week2Matchups
    ] = await Promise.all([
        getLeagueRosters(),

        loadPlayers(fetch),

        fetch(
            `https://api.sleeper.app/v1/league/${leagueID}/matchups/1`
        ).then((r) => r.json()),

        fetch(
            `https://api.sleeper.app/v1/league/${leagueID}/matchups/2`
        ).then((r) => r.json())
    ]);

    return {
        currentRosters:
            Object.values(
                rosterInfo?.rosters || {}
            ),

        players:
            playersInfo?.players || {},

        week1Matchups,

        week2Matchups,

        week1Snapshot:
            rosterHistory?.["1"] || null
    };
}
