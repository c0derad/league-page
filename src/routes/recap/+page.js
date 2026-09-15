import {
    getLeagueTeamManagers,
    loadPlayers
} from '$lib/utils/helper';

import { getNflState } from '$lib/utils/helperFunctions/nflState';
import { leagueID } from '$lib/utils/leagueInfo';

export async function load({ url, fetch }) {
    const queryWeek = Number(url.searchParams.get('week'));

    const nflState = await getNflState();

    const week =
        queryWeek ||
        Math.max(
            1,
            Number(nflState.display_week || nflState.week || 1) - 1
        );

    const matchupResponse = await fetch(
        `https://api.sleeper.app/v1/league/${leagueID}/matchups/${week}`
    );

    const rawMatchups = await matchupResponse.json();

    return {
        week,
        rawMatchups,
        leagueTeamManagersData: getLeagueTeamManagers(),
        playersData: loadPlayers(fetch)
    };
}
