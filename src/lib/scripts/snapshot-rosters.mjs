import fs from 'fs';
import path from 'path';

const LEAGUE_ID =
    '1366455175438409728';

const HISTORY_PATH =
    path.resolve(
        'src/lib/data/rosterHistory.json'
    );

async function getJSON(url) {
    const response =
        await fetch(url);

    if (!response.ok) {
        throw new Error(
            `Request failed: ${response.status} ${url}`
        );
    }

    return response.json();
}

const [
    nflState,
    rosters
] = await Promise.all([
    getJSON(
        'https://api.sleeper.app/v1/state/nfl'
    ),

    getJSON(
        `https://api.sleeper.app/v1/league/${LEAGUE_ID}/rosters`
    )
]);

const week =
    Number(nflState.week);

if (!week) {
    throw new Error(
        'Unable to determine current Sleeper week.'
    );
}

let history = {};

if (
    fs.existsSync(
        HISTORY_PATH
    )
) {
    history =
        JSON.parse(
            fs.readFileSync(
                HISTORY_PATH,
                'utf8'
            )
        );
}

const rosterSnapshot = {};

for (
    const roster
    of rosters
) {
    rosterSnapshot[
        roster.roster_id
    ] = {
        roster_id:
            roster.roster_id,

        owner_id:
            roster.owner_id,

        players:
            roster.players || [],

        starters:
            roster.starters || [],

        reserve:
            roster.reserve || [],

        taxi:
            roster.taxi || []
    };
}

history[week] = {
    capturedAt:
        new Date().toISOString(),

    rosters:
        rosterSnapshot
};

fs.mkdirSync(
    path.dirname(
        HISTORY_PATH
    ),
    {
        recursive: true
    }
);

fs.writeFileSync(
    HISTORY_PATH,
    JSON.stringify(
        history,
        null,
        2
    ) + '\n'
);

console.log(
    `Saved roster snapshot for Week ${week}`
);
