import errorToHttp from '../error-http-responses.mjs';
import { errors } from "../../common/errors.mjs";

let searchedGames = []

export default function init(gamesServices) {
    if (!gamesServices) throw errors.INVALID_ARGUMENT('gamesServices');

    return {
        getAllGames: processRequest(local_getAllGames),
        getGame: processRequest(local_getGame),
        createGame: processRequest(local_createGame),
        updateGame: processRequest(local_updateGame),
        deleteGame: processRequest(local_deleteGame),
        toggleAchievementCompleted: processRequest(local_toggleAchievementCompleted),
        searchGamesByName: processRequest(local_searchGamesByName),
        getAchievements: processRequest(local_getAchievements)
    };


    function getResponseError(res, err){
        //console.log(err);
        const responseError = errorToHttp(err);
        res.status(responseError.status);
        return res.json(responseError.body); 
    }
  
    function processRequest(operation){
        return function (req, res){
            return operation(req, res)
                .catch( e => getResponseError(res, e));
        }
    }
  
    function local_getAllGames(req, res) {
        const gamesPromise = gamesServices.getAllGames();
        return gamesPromise.then(games => {
            res.json(games);
        });
    }

    function local_getGame(req, res) {
        const id = req.params.id;
        const gamePromise = gamesServices.getGameWithProgress(id);
        return gamePromise.then(game => {
            res.json(game);
        });
    }

    function local_createGame(req, res) {
        let gameData = req.body;
        const gameExists = searchedGames.find(game => game.name === gameData.name);
        if (gameExists) {
            const createPromise = gamesServices.createGame(gameExists);
            return createPromise.then(game => {
                searchedGames = []
                res.status(201).send({
                    status: `Game "${game.name}" created`,
                    game: game
                });
            });
        }
        if(gameData.gameid){
            gameData.gameid = Number(gameData.gameid);
            const createPromise = gamesServices.createGame(gameData);
            return createPromise.then(game => {
                res.status(201).send({
                    status: `Game "${game.name}" created`,
                    game: game
                });
            });
        } 
    }

    function local_updateGame(req, res) {
        const gameId = req.params.gameId;
        const gameData = req.body;
        const updatePromise = gamesServices.updateGame(gameId, gameData);
        return updatePromise.then(game => {
            res.json(game);
        });
    }

    function local_deleteGame(req, res) {
        const gameId = req.params.gameId;
        const deletePromise = gamesServices.deleteGame(gameId);
        return deletePromise.then(() => {
            res.send(
                `Game with id ${gameId} deleted`
            );
        });
    }

    function local_toggleAchievementCompleted(req, res) {
        const gameId = req.params.gameId;
        const achievementName = req.body.achievementName;
        const markPromise = gamesServices.toggleAchievementCompleted(gameId, achievementName);
        return markPromise.then(() => {
            res.send(
                `Achievement ${achievementName} status toggled for game ${gameId}`
            );
        });
    }

    function local_searchGamesByName(req, res) {
        const gameName = req.body.name;
        const source = req.body.source;
        searchedGames = [];
        const searchPromise = gamesServices.searchGamesByName(gameName, source);
        return searchPromise.then(games => {
            searchedGames = games;
            res.json(searchedGames);
        });
    }

    function local_getAchievements(req, res) {
        const gameId = req.params.gameId;
        const source = req.body.source;
        const getPromise = gamesServices.getAchievements(gameId, source);
        return getPromise.then(achievements => {
            gamesServices.addAchievementsToGame(gameId, achievements);
            res.json(achievements);
        });
    }

}
