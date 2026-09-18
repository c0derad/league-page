import {
    getCollegeFootballWeek
} from '$lib/utils/collegeFootball';

export async function load({ fetch }) {
    let scoreboard = null;
    let error = null;

    try {
        scoreboard =
            await getCollegeFootballWeek(
                fetch,
                2026,
                3
            );
    } catch (err) {
        error =
            err?.message ||
            String(err);
    }

    return {
        debugData: {
            year: 2026,
            week: 3,
            error,
            scoreboard
        }
    };
}
