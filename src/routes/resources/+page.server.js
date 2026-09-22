import {
    loadPlayers
} from '$lib/utils/helper';

import {
    leagueID
} from '$lib/utils/leagueInfo';

import {
    getWeeklyNFLStats
} from '$lib/utils/nflStats.server.js';

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
    10: 'Moore Oil Coming',
    11: 'Campus Legends',
    12: 'Big frydown'
};

const round = (value) =>
    Math.round(
        Number(value || 0) * 100
    ) / 100;

export async function load({
    fetch
}) {
    const [
        matchupResponse,
        playersData,
        nflStats
    ] = await Promise.all([
        fetch(
            `https://api.sleeper.app/v1/league/${leagueID}/matchups/2`
        ),
        loadPlayers(fetch),
        getWeeklyNFLStats(
            fetch,
            2
        )
    ]);

    if (!matchupResponse.ok) {
        throw new Error(
            `Failed to load Week 2 matchups: ${matchupResponse.status}`
        );
    }

    const rawMatchups =
        await matchupResponse.json();

    const players =
        playersData?.players ??
        playersData ??
        {};

    const getPlayerName = (
        playerID
    ) => {
        const player =
            players?.[playerID];

        if (!player) {
            return playerID;
        }

        return (
            `${player.fn || ''} ${player.ln || ''}`
        ).trim() || playerID;
    };

    const getInjuryInfo = (
        player
    ) => {
        if (!player) {
            return null;
        }

        const injuryStatus =
            player.injury_status ??
            player.injuryStatus ??
            null;

        const status =
            player.status ??
            null;

        const bodyPart =
            player.injury_body_part ??
            player.injuryBodyPart ??
            null;

        const notes =
            player.injury_notes ??
            player.injuryNotes ??
            null;

        const practiceParticipation =
            player.practice_participation ??
            player.practiceParticipation ??
            null;

        const practiceDescription =
            player.practice_description ??
            player.practiceDescription ??
            null;

        const hasInjuryContext =
            Boolean(
                injuryStatus ||
                bodyPart ||
                notes ||
                practiceParticipation ||
                practiceDescription
            );

        if (!hasInjuryContext) {
            return null;
        }

        return {
            status,
            injuryStatus,
            bodyPart,
            notes,
            practiceParticipation,
            practiceDescription
        };
    };

    const getPlayerInfo = (
        playerID,
        matchup,
        starter
    ) => {
        const player =
            players?.[playerID];

        return {
            playerID,

            name:
                getPlayerName(
                    playerID
                ),

            position:
                player?.pos ||
                null,

            nflTeam:
                player?.t ||
                null,

            starter,

            points:
                round(
                    matchup
                        ?.players_points
                        ?.[playerID] ??
                    0
                ),

            actual:
                nflStats?.[playerID] ||
                null,

            injury:
                getInjuryInfo(
                    player
                )
        };
    };

    const teams =
        rawMatchups
            .map(
                (matchup) => {
                    const rosterID =
                        Number(
                            matchup.roster_id
                        );

                    const starterIDs =
                        new Set(
                            matchup.starters ||
                            []
                        );

                    const allPlayerIDs =
                        matchup.players ||
                        [];

                    const starters =
                        allPlayerIDs
                            .filter(
                                (playerID) =>
                                    starterIDs.has(
                                        playerID
                                    )
                            )
                            .map(
                                (playerID) =>
                                    getPlayerInfo(
                                        playerID,
                                        matchup,
                                        true
                                    )
                            )
                            .sort(
                                (a, b) =>
                                    b.points -
                                    a.points
                            );

                    const bench =
                        allPlayerIDs
                            .filter(
                                (playerID) =>
                                    !starterIDs.has(
                                        playerID
                                    )
                            )
                            .map(
                                (playerID) =>
                                    getPlayerInfo(
                                        playerID,
                                        matchup,
                                        false
                                    )
                            )
                            .sort(
                                (a, b) =>
                                    b.points -
                                    a.points
                            );

                    const injuredStarters =
                        starters.filter(
                            (player) =>
                                player.injury
                        );

                    const zeroPointStarters =
                        starters.filter(
                            (player) =>
                                player.points === 0
                        );

                    return {
                        matchupID:
                            matchup.matchup_id,

                        rosterID,

                        team:
                            TEAM_NAMES[
                                rosterID
                            ],

                        points:
                            round(
                                matchup.points
                            ),

                        starters,

                        bench,

                        benchPoints:
                            round(
                                bench.reduce(
                                    (
                                        total,
                                        player
                                    ) =>
                                        total +
                                        player.points,
                                    0
                                )
                            ),

                        injuredStarters,

                        zeroPointStarters
                    };
                }
            )
            .sort(
                (a, b) =>
                    a.matchupID -
                    b.matchupID ||
                    a.rosterID -
                    b.rosterID
            );

    const matchupIDs = [
        ...new Set(
            teams.map(
                (team) =>
                    team.matchupID
            )
        )
    ];

    const matchups =
        matchupIDs.map(
            (matchupID) => {
                const matchupTeams =
                    teams.filter(
                        (team) =>
                            team.matchupID ===
                            matchupID
                    );

                const teamA =
                    matchupTeams[0];

                const teamB =
                    matchupTeams[1];

                const winner =
                    teamA.points >=
                    teamB.points
                        ? teamA
                        : teamB;

                const loser =
                    teamA.points >=
                    teamB.points
                        ? teamB
                        : teamA;

                return {
                    matchupID,

                    teamA,
                    teamB,

                    winner:
                        winner.team,

                    loser:
                        loser.team,

                    margin:
                        round(
                            Math.abs(
                                teamA.points -
                                teamB.points
                            )
                        )
                };
            }
        );

    const allTeams =
        matchups.flatMap(
            (matchup) => [
                matchup.teamA,
                matchup.teamB
            ]
        );

    const highMan =
        [...allTeams].sort(
            (a, b) =>
                b.points -
                a.points
        )[0];

    const lowMan =
        [...allTeams].sort(
            (a, b) =>
                a.points -
                b.points
        )[0];

    const biggestBlowout =
        [...matchups].sort(
            (a, b) =>
                b.margin -
                a.margin
        )[0];

    const closestGame =
        [...matchups].sort(
            (a, b) =>
                a.margin -
                b.margin
        )[0];

    return {
        recapExport: {
            week: 2,

            highMan: {
                team:
                    highMan.team,

                points:
                    highMan.points
            },

            lowMan: {
                team:
                    lowMan.team,

                points:
                    lowMan.points
            },

            biggestBlowout: {
                winner:
                    biggestBlowout
                        .winner,

                loser:
                    biggestBlowout
                        .loser,

                margin:
                    biggestBlowout
                        .margin
            },

            closestGame: {
                winner:
                    closestGame
                        .winner,

                loser:
                    closestGame
                        .loser,

                margin:
                    closestGame
                        .margin
            },

            matchups
        }
    };
}
