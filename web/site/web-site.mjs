import errorToHttp from '../error-http-responses.mjs';
import { errors } from "../../common/errors.mjs";
import { notifications } from '../../sync-server.mjs';
import { getConfig, setConfig } from '../../common/configFunctions.mjs';
import { getLogs } from '../../server.mjs';
import fs from 'fs';
import path from 'path';

let searchedGames = []

const genres = [
    "Action", "Adventure", "RPG", "Shooter", "Strategy", "Simulation",
    "Sports", "Racing", "Puzzle", "Fighting", "Platformer",
    "Horror", "Stealth", "Survival", "MMORPG", "Sandbox",
    "Music", "Party", "Metroidvania", "Roguelike", "Visual Novel",
    "Hack and Slash", "Musou", "Action Adventure", "Open World RPG",
    "Survival Horror", "Action Horror", "Psychological Horror",
    "Soulslike", "JRPG", "Roguelite", "Racing Simulator",
    "Life Simulator"
];

export default function init(gamesServices) {
    if (!gamesServices) throw errors.INVALID_ARGUMENT('gamesServices');

    return {
        handlerError,
        homepage,
        searchGames,
        createCustomGame,
        showNotifications,
        setValues,
        configValues,
        seeLogs,
        getAllGames: processRequest(local_getAllGames),
        getGame: processRequest(local_getGame),
        createGame: processRequest(local_createGame),
        updateGame: processRequest(local_updateGame),
        deleteGame: processRequest(local_deleteGame),
        toggleAchievementCompleted: processRequest(local_toggleAchievementCompleted),
        searchGamesByName: processRequest(local_searchGamesByName),
        getAchievements: processRequest(local_getAchievements),
        toggleSynchronize: processRequest(local_toggleSynchronize)
    };
  
    function processRequest(operation){
        return function (req, res, next) {
            try {
              return Promise.resolve(operation(req, res, next)).catch(next);
            } catch (err) {
              next(err);
            }
          };
    }

    function handlerError (err, req, res, next) {
        console.log("ERROR:", err);
        const responseError = errorToHttp(err);
        const errorBody = responseError.body;
        res.status(responseError.status);
        return res.render("errors-view", {errorBody});
    }

    function homepage(req, res){
        const isAuthenticated = req.session && req.session.token;
        return res.render("homepage", { isAuthenticated });
    }

    function searchGames(req, res){
        return res.render("search-games");
    }

    function createCustomGame(req, res){
        return res.render("create-custom-game");
    }

    function showNotifications(req, res) {
        return res.render("show-notifications", { notifications })
    }

    function setValues(req, res){
        const configPath = path.join(process.cwd(), 'common', 'config.json');
        const backupStatus = req.query.backupStatus;
        const backupError = req.query.backupError;

        let configData = {};
        try {
            const rawData = fs.readFileSync(configPath, 'utf-8');
            configData = JSON.parse(rawData);
        } catch (err) {
            console.error('Error reading common.json:', err);
        }

        res.render("set-value", {
            STEAM_API_KEY: configData.STEAM_API_KEY || "",
            STEAM_USERID: configData.STEAM_USERID || "",
            RETRO_API_KEY: configData.RETRO_API_KEY || "",
            RETRO_USERNAME: configData.RETRO_USERNAME || "",
            PSN_API_KEY: configData.PSN_API_KEY || "",
            backupStatus,
            backupError
        });
    }

    function configValues(req, res){
        setConfig(req.body)
        res.redirect("/site/homepage")
    }

    function seeLogs(req, res){
        const logs = getLogs();
        res.render("logs-view", { logs });
    }
  
    function local_getAllGames(req, res) {
        const gamesPromise = gamesServices.getAllGames();
        return gamesPromise.then(games => {
            let totalAchievements = 0;
            let unlockedAchievements = 0;
            let totalGames = games.length;
            let totalGamesWithAchievements = 0;
            if(games){
                for (const game of games) {
                    const achievements = game.achievements;
                    if (achievements && achievements.length > 0) {
                        totalGamesWithAchievements++;
                        totalAchievements += achievements.length;
                        const unlocked = achievements.filter(a => a.completed).length;
                        unlockedAchievements += unlocked;
                        game.isCompleted = unlocked === achievements.length;
                    } else {
                        game.isCompleted = false;
                    }
                }
            }
            const globalPercent = totalAchievements > 0 ? ((unlockedAchievements / totalAchievements)* 100).toFixed(2) : "0.00";
            res.render("games-view", { games, totalAchievements, unlockedAchievements, globalPercent, totalGames, totalGamesWithAchievements});
        });
    }

    function local_getGame(req, res) {
        const id = req.params.id;
        if (!id || id === "Unknown" || id === "undefined" || !/^\d+$/.test(id)) {
            return res.status(204).end();
        }
        const gamePromise = gamesServices.getGameWithProgress(id);
        return gamePromise.then(game => {
            const total = game.achievements.length;
            const unlocked = game.achievements.filter(a => a.completed).length;
            const percent = total > 0 ? ((unlocked / total) * 100).toFixed(2) : "0.00";
            res.render("game-view", { game, percent, total, unlocked, genres, title: game.name });
        });
    }

    function local_createGame(req, res) {
        let gameData = req.body;
        gameData.synchronize = false;
        const gameExists = searchedGames.find(game => game.name == gameData.name);
        if (gameExists) {
            const createPromise = gamesServices.createGame(gameExists);
            return createPromise.then(game => {
                searchedGames = [];
                res.status(201).redirect("/site/games/" + game.id);
            });
        }
        if (gameData.gameid) {
            gameData.gameid = Number(gameData.gameid);
            const createPromise = gamesServices.createGame(gameData);
            return createPromise.then(game => {
            
                res.status(201).redirect("/site/games/" + game.id);
                
            });
        }
    }

    function local_updateGame(req, res) {
        const id = req.params.id;
        const gameData = req.body;
        const updatePromise = gamesServices.updateGame(id, gameData);
        return updatePromise.then(game => {
            res.redirect("/site/games/" + id);
        });
    }

    function local_deleteGame(req, res) {
        const id = req.params.id;
        const deletePromise = gamesServices.deleteGame(id);
        return deletePromise.then(() => {
            res.redirect("/site/games/");
        });
    }


    function local_toggleAchievementCompleted(req, res) {
        const id = req.params.id;
        const achievementName = req.body.achievementName;
        const markPromise = gamesServices.toggleAchievementCompleted(id, achievementName);
        return markPromise.then(() => {
            res.redirect("/site/games/" + id);
        });
    }

    function local_searchGamesByName(req, res) {
        const gameName = req.body.name;
        const source = req.body.source;
        searchedGames = [];
        const searchPromise = gamesServices.searchGamesByName(gameName, source);
        return searchPromise.then(games => {
            searchedGames = games;
            res.render("search-games", {searchedGames});
        });
    }

    function local_getAchievements(req, res) {
        const id = req.params.id;
        const gameId = req.params.gameid;
        const source = req.body.source;
        const getPromise = gamesServices.getAchievements(gameId, source);
        return getPromise.then(achievements => {
            gamesServices.addAchievementsToGame(id, achievements);
            res.redirect("/site/games/" + id);
        });
    }

    function local_toggleSynchronize(req, res){
        const id = req.params.id;
        const gamePromise = gamesServices.getGame(id);
        return gamePromise.then(game => {
            gamesServices.updateGame(id, {synchronize: !game.synchronize})
            res.redirect("/site/games/" + id)
        })
    }

}