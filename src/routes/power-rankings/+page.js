import {
    weeklyPowerRankings
} from '$lib/utils/weeklyPowerRankings';

export function load({ url }) {
    const availableWeeks =
        Object.keys(
            weeklyPowerRankings
        )
            .map(Number)
            .sort(
                (a, b) =>
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

    return {
        week,

        availableWeeks,

        rankingData:
            weeklyPowerRankings[
                week
            ]
    };
}
