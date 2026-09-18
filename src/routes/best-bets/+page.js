import {
    weeklyBestBets
} from '$lib/utils/weeklyBestBets';

export function load({ url }) {
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

    return {
        week,
        availableWeeks,
        bestBetsData:
            weeklyBestBets[week]
    };
}
