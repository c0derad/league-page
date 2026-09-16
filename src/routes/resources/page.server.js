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
        currentRosters,
        teamManagers,
        players,
        week1Matchups,
        week2Matchups
    ] = await Promise.all([
        getLeagueRosters(),
        getLeagueTeamManagers(),
        loadPlayers(fetch),

        fetch(
            `https://api.sleeper.app/v1/league/${leagueID}/matchups/1`
        ).then((r) => r.json()),

        fetch(
            `https://api.sleeper.app/v1/league/${leagueID}/matchups/2`
        ).then((r) => r.json())
    ]);

    return {
        currentRosters,
        teamManagers,
        players,
        week1Matchups,
        week2Matchups,
        week1Snapshot:
            rosterHistory?.["1"] || null
    };
}
