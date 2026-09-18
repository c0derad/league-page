import {
    weeklyBestBets
} from '$lib/utils/weeklyBestBets';

import {
    getCollegeFootballWeek
} from '$lib/utils/collegeFootball';

const normalize = (value) =>
    String(value || '')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');

const getGamesFromScoreboard = (scoreboard) => {
    if (Array.isArray(scoreboard?.games)) {
        return scoreboard.games;
    }

    if (Array.isArray(scoreboard)) {
        return scoreboard;
    }

    return [];
};

const getTeamName = (team) =>
    team?.names?.short ||
    team?.names?.seo ||
    team?.name ||
    team?.school ||
    team?.names?.full ||
    '';

const getTeamSlug = (team) =>
    team?.names?.seo ||
    team?.seo ||
    team?.slug ||
    normalize(getTeamName(team));

const findGameForTeam = (
    games,
    teamName,
    teamSlug
) => {
    const searchValues =
        [
            normalize(teamName),
            normalize(teamSlug)
        ].filter(Boolean);

    return games.find((game) => {
        const away =
            game?.game?.away ||
            game?.away ||
            game?.teams?.away;

        const home =
            game?.game?.home ||
            game?.home ||
            game?.teams?.home;

        const values = [
            normalize(
                getTeamName(away)
            ),
            normalize(
                getTeamSlug(away)
            ),
            normalize(
                getTeamName(home)
            ),
            normalize(
                getTeamSlug(home)
            )
        ];

        return searchValues.some(
            (search) =>
                values.includes(search)
        );
    });
};

const enrichBet = (
    bet,
    games
) => {
    const game =
        findGameForTeam(
            games,
            bet.team,
            bet.teamSlug
        );

    if (!game) {
        return {
            ...bet,
            opponent:
                bet.opponent ||
                'Opponent TBD',

            opponentSlug:
                bet.opponentSlug ||
                null,

            matchupFound: false
        };
    }

    const away =
        game?.game?.away ||
        game?.away ||
        game?.teams?.away;

    const home =
        game?.game?.home ||
        game?.home ||
        game?.teams?.home;

    const awayName =
        getTeamName(away);

    const homeName =
        getTeamName(home);

    const awaySlug =
        getTeamSlug(away);

    const homeSlug =
        getTeamSlug(home);

    const selectedIsAway =
        normalize(awayName) ===
            normalize(bet.team) ||
        normalize(awaySlug) ===
            normalize(bet.teamSlug);

    const opponent =
        selectedIsAway
            ? home
            : away;

    return {
        ...bet,

        opponent:
            getTeamName(opponent),

        opponentSlug:
            getTeamSlug(opponent),

        matchupFound: true,

        location:
            selectedIsAway
                ? 'away'
                : 'home'
    };
};

export async function load({
    url,
    fetch
}) {
    const availableWeeks =
        Object.keys(
            weeklyBestBets
        )
            .map(Number)
            .sort(
                (a, b) =>
                    a - b
            );

    const latestPublishedWeek =
        availableWeeks[
            availableWeeks.length - 1
        ] || 1;

    const requestedWeek =
        Number(
            url.searchParams.get(
                'week'
            )
        );

    const week =
        availableWeeks.includes(
            requestedWeek
        )
            ? requestedWeek
            : latestPublishedWeek;

    const bestBetsData =
        weeklyBestBets[week];

    const year =
        bestBetsData.year ||
        2026;

    let games = [];

    try {
        const scoreboard =
            await getCollegeFootballWeek(
                fetch,
                year,
                week
            );

        games =
            getGamesFromScoreboard(
                scoreboard
            );
    } catch (error) {
        console.error(
            'Failed to load NCAA matchups',
            error
        );
    }

    const bets =
        bestBetsData.bets.map(
            (bet) =>
                enrichBet(
                    bet,
                    games
                )
        );

    return {
        week,
        availableWeeks,

        bestBetsData: {
            ...bestBetsData,
            bets
        }
    };
}
