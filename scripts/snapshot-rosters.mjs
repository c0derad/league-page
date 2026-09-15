import fs from 'fs';
import path from 'path';

const LEAGUE_ID = '1366455175438409728';

const HISTORY_PATH = path.resolve(
    'src/lib/data/rosterHistory.json'
);

async function getJSON(url) {
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(
            `Sleeper request failed: ${response.status} ${url}`
        );
    }

    return response.json();
}

const [
    nflState,
    rosters,
    users
] = await Promise.all([
    getJSON(
        'https://api.sleeper.app/v1/state/nfl'
    ),

    getJSON(
        `https://api.sleeper.app/v1/league/${LEAGUE_ID}/rosters`
    ),

    getJSON(
        `https://api.sleeper.app/v1/league/${LEAGUE_ID}/users`
    )
]);

const week =
    Number(nflState.week);

if (!week) {
    throw new Error(
        'Unable to determine current Sleeper week.'
    );
}

console.log(
    `Sleeper current week: ${week}`
);

const usersByID =
    Object.fromEntries(
        users.map(
            (user) => [
                user.user_id,
                user
            ]
        )
    );

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

for (const roster of rosters) {
    const user =
        usersByID[
            roster.owner_id
        ];

    const players =
        roster.players || [];

    const starters =
        roster.starters || [];

    const starterSet =
        new Set(starters);

    const bench =
        players.filter(
            (playerID) =>
                !starterSet.has(
                    playerID
                )
        );

    rosterSnapshot[
        roster.roster_id
    ] = {
        rosterID:
            roster.roster_id,

        ownerID:
            roster.owner_id,

        sleeperUsername:
            user?.display_name ||
            null,

        teamName:
            user?.metadata?.team_name ||
            null,

        players,

        starters,

        bench,

        reserve:
            roster.reserve || [],

        taxi:
            roster.taxi || []
    };
}

/*
 * If this week's snapshot already exists,
 * replace it with the latest Thursday snapshot.
 *
 * Previous weeks remain untouched.
 */
history[
    String(week)
] = {
    capturedAt:
        new Date().toISOString(),

    leagueID:
        LEAGUE_ID,

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
    `Saved fantasy roster snapshot for Week ${week}.`
);

console.log(
    `${rosters.length} fantasy rosters captured.`
);
