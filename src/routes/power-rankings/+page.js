import {
    weeklyPowerRankings
} from '$lib/utils/weeklyPowerRankings';

const getScoreHistory = (
    team,
    rankingWeek
) => {
    const scores = [];

    for (
        let week = 1;
        week < rankingWeek;
        week++
    ) {
        const score =
            team[
                `week${week}Score`
            ];

        if (
            typeof score ===
            'number'
        ) {
            scores.push({
                week,
                score
            });
        }
    }

    return scores;
};

const getAverageScore = (
    scoreHistory
) => {
    if (
        scoreHistory.length === 0
    ) {
        return null;
    }

    const total =
        scoreHistory.reduce(
            (
                sum,
                item
            ) =>
                sum +
                item.score,
            0
        );

    return (
        total /
        scoreHistory.length
    );
};

export function load({
    url
}) {
    const availableWeeks =
        Object.keys(
            weeklyPowerRankings
        )
            .map(Number)
            .sort(
                (
                    a,
                    b
                ) =>
                    a - b
            );

    const latestWeek =
        Math.max(
            ...availableWeeks
        );

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
            : latestWeek;

    const rawRankingData =
        weeklyPowerRankings[
            week
        ];

    const rankings =
        rawRankingData.rankings.map(
            (team) => {
                const scoreHistory =
                    getScoreHistory(
                        team,
                        week
                    );

                const avgScore =
                    getAverageScore(
                        scoreHistory
                    );

                return {
                    ...team,
                    scoreHistory,
                    avgScore
                };
            }
        );

    return {
        week,
        availableWeeks,

        rankingData: {
            ...rawRankingData,
            rankings
        }
    };
}
