import {
    getLeagueMatchups,
    getLeagueTeamManagers,
    loadPlayers
} from '$lib/utils/helper';

export async function load({ fetch }) {
    return {
        queryWeek: 2,
        matchupsData: getLeagueMatchups(),
        leagueTeamManagersData: getLeagueTeamManagers(),
        playersData: loadPlayers(fetch)
    };
}
