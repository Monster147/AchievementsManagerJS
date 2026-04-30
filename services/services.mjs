import { errors } from "../common/errors.mjs";

export default function init(gamesData, searchData) {

    if(!gamesData) throw errors.INVALID_ARGUMENT('gamesData')
    if(!searchData) throw errors.INVALID_ARGUMENT('searchData')

    return {
        getAllGames,
        createGame,
        updateGame,
        deleteGame,
        addAchievementsToGame,
        toggleAchievementCompleted,
        getGameWithProgress,
        searchGamesByName,
        getAchievements,
        getGame
    }


    function getAllGames() {
        return gamesData.getAllGames()
    }

    function getGame(id){
        return gamesData.getGame(id)
    }

    function createGame(gameData) {
        return gamesData.createGame(gameData)
    }

    async function updateGame(id, gameData) {
        const game = await gamesData.getGame(id)
        if (!game) return Promise.reject(errors.GAME_NOT_FOUND(id))
        return gamesData.updateGame(game.id, gameData)
    }

    async function deleteGame(id) {
        const game = await gamesData.getGame(id)
        if (!game) return Promise.reject(errors.GAME_NOT_FOUND(id))
        return gamesData.deleteGame(game.id)
    }

    async function addAchievementsToGame(gameId, newAchievements) {
        const game = await gamesData.getGame(gameId)
        if (!game) return Promise.reject(errors.GAME_NOT_FOUND(gameId))
        return gamesData.addAchievementsToGame(game.gameid, newAchievements)
    }

    async function toggleAchievementCompleted(gameId, achievementName) {
        const game = await gamesData.getGame(gameId)
        if (!game) return Promise.reject(errors.GAME_NOT_FOUND(gameId))
        return gamesData.toggleAchievementCompleted(game.gameid, achievementName)
    }

    async function getGameWithProgress(gameId) {
        const game = await gamesData.getGame(gameId)
        if (!game) return Promise.reject(errors.GAME_NOT_FOUND(gameId))
        return gamesData.getGameWithProgress(gameId)
    }

    async function searchGamesByName(name, source){
        const toReturn = await searchData.searchGamesByName(name, source)
        return toReturn
    }

    async function getAchievements(gameId, source) {
        const toReturn = await searchData.getAchievements(gameId, source)
        return toReturn
    }
}