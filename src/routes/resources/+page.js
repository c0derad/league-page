import { leagueID } from '$lib/utils/leagueInfo';

export async function load({ fetch }) {
    const response = await fetch(
        `https://api.sleeper.app/v1/league/${leagueID}/rosters`
    );

    if (!response.ok) {
        throw new Error(
            `Sleeper rosters failed: ${response.status}`
        );
    }

    const rosters = await response.json();

    return {
        debug: {
            leagueID,
            isArray: Array.isArray(rosters),
            rosterCount: Array.isArray(rosters)
                ? rosters.length
                : null,
            dataType: typeof rosters,
            firstRoster: Array.isArray(rosters)
                ? rosters[0]
                : rosters
        }
    };
}
