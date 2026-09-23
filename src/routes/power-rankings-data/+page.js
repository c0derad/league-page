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
        week3Matchups
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

    return {
        currentRosters,
        teamManagers,
        players,
        week1Matchups,
        week2Matchups,
        week3Matchups,

        week1Snapshot:
            rosterHistory?.["1"] || null,

        week2Snapshot:
            rosterHistory?.["2"] || null
    };
}
