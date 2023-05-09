const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const dbPath = path.join(__dirname, "cricketMatchDetails.db");

const app = express();
app.use(express.json());
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server has started");
    });
  } catch (e) {
    console.log(`DB error ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const convertPlayerDbObjectToResponseObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

// api 1
app.get("/players/", async (request, response) => {
  const getPlayerQuery = `
    SELECT
      *
    FROM
      player_details;`;
  const playersArray = await db.all(getPlayerQuery);
  response.send(
    playersArray.map((eachPlayer) =>
      convertPlayerDbObjectToResponseObject(eachPlayer)
    )
  );
});

// api 2

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const query = `SELECT player_id as playerId,player_name as playerName  FROM player_details
  WHERE player_id =${playerId};`;
  const dbResponse = await db.get(query);
  response.send(dbResponse);
});

// api 3

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const query = `UPDATE player_details
  SET player_name = "${playerName}"
  WHERE player_id = ${playerId};`;
  const dbResponse = await db.run(query);
  response.send("Player Details Updated");
});

// api 4

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const query = `SELECT match_id as matchId,match,year FROM match_details
  WHERE match_id =${matchId};`;
  const dbResponse = await db.get(query);
  response.send(dbResponse);
});

// api 5

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const query = `SELECT match_details.match_id as matchId,match_details.match,match_details.year FROM match_details inner join player_match_score on 
  match_details.match_id = player_match_score.match_id
  WHERE player_id = ${playerId};`;
  const dbResponse = await db.all(query);
  response.send(dbResponse);
});

// api 6

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const query = `SELECT player_details.player_id as playerId,
  player_details.player_name as playerName FROM player_details inner join player_match_score on 
  player_details.player_id = player_match_score.player_id
  WHERE match_id = ${matchId};`;
  const dbResponse = await db.all(query);
  response.send(dbResponse);
});

// api 7

app.get("/players/:playerId/playerScores/", async (request, response) => {
  const { playerId } = request.params;
  const query = `
    SELECT
    player_details.player_id AS playerId,
    player_details.player_name AS playerName,
    SUM(player_match_score.score) AS totalScore,
    SUM(fours) AS totalFours,
    SUM(sixes) AS totalSixes FROM 
    player_details INNER JOIN player_match_score ON
    player_details.player_id = player_match_score.player_id
    WHERE player_details.player_id = ${playerId};
    `;
  const dbResponse = await db.get(query);
  response.send(dbResponse);
});

// sample

module.exports = app;
