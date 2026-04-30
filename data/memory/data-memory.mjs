import { errors } from "../../common/errors.mjs";

const GAMES = [
    { 
        id: 1,
        gameid: 1,
        name: "The Legend of Zelda: Ocarina of Time",  
        genre: "Action-adventure", 
        platform: "Nintendo 64", 
        releaseyear: 1998,
        cover: "https://www.mobygames.com/images/covers/l/241366-the-legend-of-zelda-ocarina-of-time-nintendo-64-front-cover.jpg",
        source: "RetroAchievements",
        achievements: [
            { name: "Defeated Ganon", description: "Killed Ganon", completed: false },
            { name: "Collected all Heart Pieces", description: "All 10 Heart Pieces Collected", completed: false },
            { name: "Completed the game", description: "Reached the end of the game", completed: false },
        ],
    },
]

const GAME_PROGRESS = [
    {
        gameId: 1,
        completedAchievements: ["Defeated Ganon"]
    },
]

export default function init() {
    return {
        getAllGames,
        getGame,
        createGame,
        updateGame,
        deleteGame,
        addAchievementsToGame,
        toggleAchievementCompleted,
        getGameWithProgress,
    }


function getAllGames(){
    return Promise.all(GAMES.map(game => getGameWithProgress(game.id)));
}

function getGame(id) {
    return Promise.resolve(GAMES.find(game => game.id == id));
}

function createGame(gameData) {
    return new Promise((resolve, reject) => {
        const newGame = {
            id: GAMES.length + 1,
            gameid: gameData.gameid,
            name: gameData.name,
            genre: gameData.genre || "Unknown",
            platform: gameData.platform || "Unknown",
            releaseyear: gameData.releaseyear || "Unknown",
            cover: gameData.cover || "Unknown",
            source: gameData.source || "Unknown",
            achievements: []
        };
        if(GAMES.some(g => g.name == newGame.name)) {
            return reject(errors.DUPLICATE_GAME(newGame.name));
        }
        GAMES.push(newGame);
        resolve(newGame);
    });
}

function updateGame(id, gameData) {
    return new Promise((resolve, reject) => {
        let gameIDX = GAMES.findIndex(g => g.id == id);
        if (gameIDX == -1) {
            return reject(errors.GAME_NOT_FOUND(id));
        }
        GAMES[gameIDX].gameid = gameData.gameid;
        GAMES[gameIDX].name = gameData.name;
        GAMES[gameIDX].genre = gameData.genre;
        GAMES[gameIDX].platform = gameData.platform;
        GAMES[gameIDX].releaseyear = gameData.releaseyear;
        GAMES[gameIDX].cover = gameData.cover;
        GAMES[gameIDX].source = gameData.source;
        resolve(GAMES[gameIDX]);
    })
}

function deleteGame(id) {
    return new Promise((resolve, reject) => {
        const gameIndex = GAMES.findIndex(g => g.id == id);
        if (gameIndex != -1) {
            let game = GAMES[gameIndex];
            GAMES.splice(gameIndex, 1)[0]
            resolve(game);
        } else {
            return reject(errors.GAME_NOT_FOUND);
        }
    });
}

function addAchievementsToGame(id, newAchievements) {
    return new Promise((resolve, reject) => {
        const game = GAMES.find(g => g.id == id);
        if (!game) {
            return reject(errors.GAME_NOT_FOUND(id));

        }

        for (const achievement of newAchievements) {
            if (game.achievements.some(a => a.name == achievement.name)) {
                return reject(errors.DUPLICATE_ACHIEVEMENT(achievement.name));
            }
            game.achievements.push(achievement);
        }
        resolve(game);
    });
}

function toggleAchievementCompleted(id, achievementName) {
    return new Promise((resolve, reject) => {
        const game = GAMES.find(g => g.id == id);
        if (!game) {
            return reject(errors.GAME_NOT_FOUND(id));
        }
        
        let progress = GAME_PROGRESS.find(entry => entry.gameId == game.gameid);
        const gameId = game.gameid
        
        if (!progress) {
            progress = { gameId, completedAchievements: [] };
            GAME_PROGRESS.push(progress);
        }

        const achievementIndex = progress.completedAchievements.indexOf(achievementName);

        if (achievementIndex === -1) {
            // Not completed, mark as completed
            progress.completedAchievements.push(achievementName);
        } else {
            // Already completed, unmark it
            progress.completedAchievements.splice(achievementIndex, 1);
        }
        resolve(progress);
    })
}

function getGameWithProgress(id) {
    return new Promise((resolve, reject) => {
        
        const game = GAMES.find(g => g.id == id);
        if (!game) {
            return reject(errors.GAME_NOT_FOUND(id));
        }

        const progressEntry = GAME_PROGRESS.find(p => p.gameId == game.gameid);
        const completed = progressEntry ? progressEntry.completedAchievements : [];

        const achievementsWithProgress = game.achievements.map(a => ({
            ...a,
            completed: completed.includes(a.name),
        }));

        resolve({
            ...game,
            achievements: achievementsWithProgress
        });
    })
}
}
