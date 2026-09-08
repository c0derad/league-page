/*   STEP 1   */
export const leagueID = "1366455175438409728"; // your league ID
export const leagueName = "TouchDown Syndrome"; // your league name
export const dues = 100; // (optional) used in template constitution page
export const dynasty = false; // true for dynasty leagues, false for redraft and keeper
export const enableBlog = false; // requires VITE_CONTENTFUL_ACCESS_TOKEN and VITE_CONTENTFUL_SPACE environment variables

/*   STEP 2   */
export const homepageText = `
  <p><strong>Welcome to TouchDown Syndrome.</strong></p>
  <p>This is where bad trades are preserved forever, waiver claims become evidence, and every lineup decision can and will be used against you.</p>
  <p>What started as a fantasy football league has evolved into a season-long exercise in roster construction, overconfidence, panic, collusion accusations, and pretending a 1-4 team is still "one move away."</p>
  <p>Here you can track the standings, weekly matchups, league history, draft results, transactions, records, power rankings, and all the other evidence required to determine who actually knows ball and who has simply been getting away with it.</p>
  <p>Championships matter. Points matter. Rivalries matter. Receipts matter most.</p>
  <p>Long live the Czar.</p> `;

/*   STEP 3   */
/*
3 managers as an example. Uncomment (remove the //) before each line to make it live code
If you're having trouble, reference the Training Wheels' Manager Section
https://github.com/nmelhado/league-page/blob/master/TRAINING_WHEELS.md#ii-adding-managers-and-changing-the-homepage-text
*/

// To omit an optional field, set it's value to null

export const managers = [
  {
    "managerID": "873018604659118080",
    "name": "Brad",
    "location": "Dallas, TX",
    "school": "Alabama",
    "bio": "THE CZAR",
    "photo": "/managers/conrad.png",
    "favoriteTeam": "ne",
  },
  {
    "managerID": "1132146450068205568",
    "name": "JV",
    "location": "Dallas, TX",
    "school": "Penn State",
    "bio": "Peter Pan",
    "photo": null,
    "favoriteTeam": "pit",
  },
  {
    "managerID": "1132146764921982976",
    "name": "Chaney",
    "location": "Dallas, TX",
    "school": "TCU",
    "bio": "Chain Gang",
    "photo": null,
    "favoriteTeam": "dal",
  },
  {
    "managerID": "1132146859176460288",
    "name": "Trevor",
    "location": "Dallas, TX",
    "school": "Alabama",
    "bio": "The Bear",
    "photo": null,
    "favoriteTeam": null,
  },
  {
    "managerID": "1132151539948347392",
    "name": "Rhodes x Pags",
    "coManagerID": "1263967779644518400",
    "location": "Dallas, TX",
    "school": "Villanova x Northwestern",
    "bio": null,
    "photo": null,
    "favoriteTeam": "ne",
  },
  {
    "managerID": "1132160162426511360",
    "name": "J-Bone",
    "location": "Dallas, TX",
    "school": "Texas Tech",
    "bio": null,
    "photo": null,
    "favoriteTeam": "dal",
  },
  {
    "managerID": "1132160905275404288",
    "name": "Vigo",
    "location": "Dallas, TX",
    "school": "Alabama",
    "bio": null,
    "photo": null,
    "favoriteTeam": null,
  },
  {
    "managerID": "1132162695655997440",
    "name": "Ryan",
    "location": "Somewhere in California",
    "school": "United States Coast Guard Academy",
    "bio": null,
    "photo": null,
    "favoriteTeam": null,
  },
  {
    "managerID": "1132179431537242112",
    "name": "Charles",
    "location": "Dallas, TX",
    "school": "TCU",
    "bio": null,
    "photo": null,
    "favoriteTeam": "chi",
  },
  {
    "managerID": "1132448998603829248",
    "name": "Josh",
    "location": "Denver, CO",
    "school": "Indiana",
    "bio": null,
    "photo": null,
    "favoriteTeam": "chi",
  },
  {
    "managerID": "773337849662889984",
    "name": "JQ",
    "location": "Cincinatti, OH",
    "school": "Alabama",
    "bio": null,
    "photo": null,
    "favoriteTeam": "pit",
  },
  {
    "managerID": "1256721112734121984",
    "name": "T2",
    "location": "Dallas, TX",
    "school": "Alabama",
    "bio": null,
    "photo": null,
    "favoriteTeam": null,
  },
]
  
  
  /*   !!  !!  IMPORTANT  !!  !! */
  /*
  Below is the most up to-date version of a manager. Please leave this commented out
  and don't delete it. This will be updated if any fields are added, removed or changed
  and will allow updates without causing merge conflicts
  */
  
    // {
    //   "roster": 3,  // (DEPRECATED! Don't use this anymore) ID of the roster that the manager manages (look at the order of the power rankings graph)
    //   "managerID": "12345678",  // the user's manager ID, go to https://api.sleeper.app/v1/league/<your_league_id>/users to find user IDs (you can use older leagueIDs to find user IDs for managers that are no longer in the league)
    //   "name": "Your Name",
    //   "tookOver": 2020, // (DEPRECATED! You don't need to use this anymore) (optional) used if a manager took over a team, delete this line or change to null otherwise
    //   "location": "Brooklyn", // (optional)
    //   "bio": "Lorem ipsum...",
    //   "photo": "/managers/name.jpg", // square ratio recommended (no larger than 500x500)
    //   "fantasyStart": 2014, // (optional) when did the manager start playing fantasy football
    //   "favoriteTeam": "nyj", // (optional) favorite NFL team, (follows convention: nyj, sea, mia, etc.) MUST BE LOWERCASE
    //   "mode": "Win Now", // (optional) 'Win Now', 'Dynasty', or 'Rebuild' (anything else and you will need to add a new png to /static/ similar to the 'Rebuild.png' and 'Win Now.png' currently in there)
    //   "rival": {
    //     name: "Rival", // Can be anything (usually your rival's name)
    //     link: 6, // manager array number within this array, or null to link back to all managers page
    //     image: "/managers/rival.jpg", // either a specific manager photo or '/managers/everyone.png' or '/managers/question.png'
    //   },
    //   "favoritePlayer": 1426, // (optional) this corresponds to the Sleeper player ID (https://api.sleeper.app/v1/players/nfl)
    //   "valuePosition": "WR", // (optional) Favorite position (QB, WR, RB, TE, etc.)
    //   "rookieOrVets": "Rookies", // (optional) 'Rookies' or 'Vets' (anything else and you will need to add a new png to /static/ similar to the 'Rookies.png' and 'Vets.png' currently in there)
    //   "philosophy": "Your fantasy team's philosophy", // (optional)
    //   "tradingScale": 10, // 1 - 10 (optional)
    //   "preferredContact": "Text",  // (optional) 'Text', 'WhatsApp', 'Sleeper', 'Email', 'Phone', 'Discord', and 'Carrier Pigeon' are currently supplied in the template
    // },
    
