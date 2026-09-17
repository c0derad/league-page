import { loadPlayers } from '$lib/utils/helper';
import { leagueID } from '$lib/utils/leagueInfo';
import rosterHistory from '$lib/data/rosterHistory.json';

const TEAM_NAMES = {
    1: 'Critical Chase Theory',
    2: 'PeterPanthers',
    3: 'The Oilers',
    4: 'Show Me Your TDs',
    5: 'Rhodes x Pags',
    6: '#FreeTony',
    7: 'Retardinals',
    8: 'Naberhood Sex Offender',
    9: 'Charles',
    10: 'ConsiderMeOiled',
    11: 'Campus Legends',
    12: 'Big frydown'
};

const round = (value) =>
    Math.round(Number(value || 0) * 100) / 100;

export async function load({ fetch }) {
    const [
        rostersResponse,
        matchupsResponse,
        playersInfo
    ] = await Promise.all([
        fetch(
            `https://api.sleeper.app/v1/league/${leagueID}/rosters`
        ),
        fetch(
            `https://api.sleeper.app/v1/league/${leagueID}/matchups/2`
        ),
        loadPlayers(fetch)
    ]);

    if (!rostersResponse.ok) {
        throw new Error(
            `Failed to load rosters: ${rostersResponse.status}`
        );
    }

    if (!matchupsResponse.ok) {
        throw new Error(
            `Failed to load Week 2 matchups: ${matchupsResponse.status}`
        );
    }

    const [
        rosters,
        matchups
    ] = await Promise.all([
        rostersResponse.json(),
        matchupsResponse.json()
    ]);

    const players =
        playersInfo?.players ??
        playersInfo ??
        {};

    const snapshot =
        rosterHistory?.['2'] ||
        null;

    const getPlayer = (playerID) =>
        players?.[playerID] || null;

    const getPlayerInfo = (playerID) => {
        const player =
            getPlayer(playerID);

        return {
            playerID,

            name:
                player
                    ? `${player.fn || ''} ${player.ln || ''}`.trim()
                    : playerID,

            position:
                player?.pos || null,

            nflTeam:
                player?.t || null,

            projection:
                round(
                    player?.wi?.[2]?.p ||
                    0
                )
        };
    };

    const getRoster = (rosterID) =>
        rosters.find(
            (roster) =>
                Number(roster.roster_id) ===
                Number(rosterID)
        );

    const getMatchup = (rosterID) =>
        matchups.find(
            (matchup) =>
                Number(matchup.roster_id) ===
                Number(rosterID)
        );

    const getOpponentID = (rosterID) => {
        const matchup =
            getMatchup(rosterID);

        if (!matchup) {
            return null;
        }

        const opponent =
            matchups.find(
                (item) =>
                    item.matchup_id ===
                        matchup.matchup_id &&
                    Number(item.roster_id) !==
                        Number(rosterID)
            );

        return opponent
            ? Number(opponent.roster_id)
            : null;
    };

    const buildTeam = (rosterID) => {
        const roster =
            getRoster(rosterID);

        if (!roster) {
            return null;
        }

        const starters =
            roster.starters || [];

        const starterInfo =
            starters.map(
                getPlayerInfo
            );

        const starterIDs =
            new Set(starters);

        const benchInfo =
            (roster.players || [])
                .filter(
                    (playerID) =>
                        !starterIDs.has(
                            playerID
                        )
                )
                .map(
                    getPlayerInfo
                );

        const projection =
            round(
                starterInfo.reduce(
                    (
                        total,
                        player
                    ) =>
                        total +
                        Number(
                            player.projection ||
                            0
                        ),
                    0
                )
            );

        return {
            rosterID,

            team:
                TEAM_NAMES[
                    rosterID
                ],

            projection,

            starters:
                starterInfo.sort(
                    (a, b) =>
                        b.projection -
                        a.projection
                ),

            bench:
                benchInfo.sort(
                    (a, b) =>
                        b.projection -
                        a.projection
                )
        };
    };

    const processedMatchupIDs =
        new Set();

    const week2Matchups = [];

    for (const matchup of matchups) {
        if (
            processedMatchupIDs.has(
                matchup.matchup_id
            )
        ) {
            continue;
        }

        processedMatchupIDs.add(
            matchup.matchup_id
        );

        const teams =
            matchups.filter(
                (item) =>
                    item.matchup_id ===
                    matchup.matchup_id
            );

        if (teams.length !== 2) {
            continue;
        }

        const teamAID =
            Number(
                teams[0].roster_id
            );

        const teamBID =
            Number(
                teams[1].roster_id
            );

        const teamA =
            buildTeam(teamAID);

        const teamB =
            buildTeam(teamBID);

        week2Matchups.push({
            matchupID:
                matchup.matchup_id,

            teamA,

            teamB,

            projectedTotal:
                round(
                    teamA.projection +
                    teamB.projection
                ),

            projectedMargin:
                round(
                    Math.abs(
                        teamA.projection -
                        teamB.projection
                    )
                ),

            projectedWinner:
                teamA.projection >=
                teamB.projection
                    ? teamA.team
                    : teamB.team
        });
    }

    return {
        previewData: {
            generatedAt:
                new Date()
                    .toISOString(),

            week: 2,

            snapshotAvailable:
                Boolean(snapshot),

            snapshotCapturedAt:
                snapshot?.capturedAt ||
                snapshot?.captured_at ||
                null,

            matchups:
                week2Matchups.sort(
                    (a, b) =>
                        a.matchupID -
                        b.matchupID
                )
        }
    };
}
