import { searchSteamGameByName, getSteamAchievements, syncSteamAchievements } from './steam-games.mjs';
import { getRetroAchievements, syncRetroAchievements } from './retro-games.mjs';
import { searchPSNGameByName, getPSNAchievements} from './psn-games.mjs';
import { errors } from '../../common/errors.mjs';
//import gamesDataInit from '../memory/data-memory.mjs';
import gamesDataInit from '../fileDB/data.mjs'
import gamesServicesInit from '../../services/services.mjs';
import '../../sync-server.mjs';
import { notifyClients } from '../../sync-server.mjs';


const searchData = init();
const gamesData = gamesDataInit();
const gamesServices = gamesServicesInit(gamesData, searchData);

export default function init(){

    return {
        searchGamesByName,
        getAchievements
    };
    
}

async function searchGamesByName(name, source) {
    switch(source.toLowerCase()) {
        case 'steam':
            const toReturn = await searchSteamGameByName(name);
            return toReturn;
        case 'psn':
            return await searchPSNGameByName(name);
        default:
            return Promise.reject(errors.INVALID_SEARCH_SOURCE(source));
    }
}

async function getAchievements(gameId, source) {
    switch(source.toLowerCase()) {
        case 'steam':
            const toReturn = await getSteamAchievements(gameId);
            return toReturn;
        case 'retroachievements':
            return await getRetroAchievements(gameId);
        case 'psn':
            return await getPSNAchievements(gameId);
        default:
            return Promise.reject(errors.INVALID_ACHIEVEMENT_SOURCE(source));
    }
}

export async function syncAchievements(){
    const games = await gamesServices.getAllGames();
    const newlyUnlockedAll = [];
    for(const game of games){
        if(game.synchronize){
            let unlocked = [];
            switch(game.source.toLowerCase()) {
                case 'steam':
                    unlocked = await syncSteamAchievements(game.id, game.gameid) || [];
                    break;
                case 'retroachievements':
                    unlocked = await syncRetroAchievements(game.id, game.gameid) || [];
                    break;
                default:
                    continue
            }
            newlyUnlockedAll.push(...unlocked);
        }
    }   
    if (newlyUnlockedAll.length > 0) {
        notifyClients({
            type: 'achievement-unlocked',
            data: newlyUnlockedAll
        });
    }
}