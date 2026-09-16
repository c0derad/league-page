import {
    loadPlayers
} from '$lib/utils/helper';

import {
    leagueID
} from '$lib/utils/leagueInfo';

import rosterHistory from '$lib/data/rosterHistory.json';

export async function load({ fetch }) {
    const [
        currentRostersResponse,
        playersInfo,
        week1MatchupsResponse,
        week2MatchupsResponse
    ] = await Promise.all([
        fetch(
            `https://api.sleeper.app/v1/league/${leagueID}/rosters`
        ),

        loadPlayers(fetch),

        fetch(
            `https://api.sleeper.app/v1/league/${leagueID}/matchups/1`
        ),

        fetch(
            `https://api.sleeper.app/v1/league/${leagueID}/matchups/2`
        )
    ]);

    if (!currentRostersResponse.ok) {
        throw new Error(
            `Failed to load current rosters: ${currentRostersResponse.status}`
        );
    }

    if (!week1MatchupsResponse.ok) {
        throw new Error(
            `Failed to load Week 1 matchups: ${week1MatchupsResponse.status}`
        );
    }

    if (!week2MatchupsResponse.ok) {
        throw new Error(
            `Failed to load Week 2 matchups: ${week2MatchupsResponse.status}`
        );
    }

    const [
        currentRosters,
        week1Matchups,
        week2Matchups
    ] = await Promise.all([
        currentRostersResponse.json(),
        week1MatchupsResponse.json(),
        week2MatchupsResponse.json()
    ]);

    return {
        currentRosters,

        players:
            playersInfo?.players || {},

        week1Matchups,

        week2Matchups,

        week1Snapshot:
            rosterHistory?.["1"] || null
    };
}
