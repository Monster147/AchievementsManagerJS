import fetch from 'node-fetch';
import { errors } from '../../common/errors.mjs';
import dotenv from 'dotenv';
//import gamesDataInit from '../memory/data-memory.mjs';
import gamesDataInit from '../fileDB/data.mjs'
import gamesServicesInit from '../../services/services.mjs';
import searchDataInit from './search-games.mjs'
import { getConfig } from '../../common/configFunctions.mjs';

const searchData = searchDataInit();
const gamesData = gamesDataInit();
const gamesServices = gamesServicesInit(gamesData, searchData);

dotenv.config();

// In-memory cache as array
const cache = [];

let steamId = null;
let steamApiKey = null;

function getFromCache(type, key) {
    return cache.find(entry => entry.type === type && entry.key === key)?.value;
}

function setToCache(type, key, value) {
    cache.push({ type, key, value });
}

export async function searchSteamGameByName(name) {
    const cacheKey = name.toLowerCase();
    const cached = getFromCache('search', cacheKey);
    if (cached) {
        //console.log('Returning cached search result.');
        return cached;
    }
    const response = await fetch(`https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(name)}&cc=us&l=en`);
    const data = await response.json();

    if (!data.items || data.items.length === 0) {
        throw new Error('No games found.');
    }

    const filteredItems = data.items.map(item => ({
        name: item.name,
        gameid: item.id,
        cover: item.tiny_image,
        source: 'steam'
    }));

    setToCache('search', cacheKey, filteredItems);
    return filteredItems;
}

export async function getSteamAchievements(appId) {
    if(steamApiKey == null) steamApiKey = getConfig().STEAM_API_KEY
    const cacheKey = appId.toString();
    const cached = getFromCache('achievements', cacheKey);
    if (cached) {
        //console.log('Returning cached achievements.');
        return cached;
    }
    const response = await fetch(`https://api.steampowered.com/ISteamUserStats/GetSchemaForGame/v2/?key=${steamApiKey}&appid=${appId}`);
    const data = await response.json();

    if (!data.game || !data.game.availableGameStats || !data.game.availableGameStats.achievements) {
        return Promise.reject(errors.ACHIEVEMENTS_NOT_FOUND(appId));
    }

    const rawAchievements = data.game.availableGameStats.achievements;
    const transformedAchievements = rawAchievements.map(achievement => ({
        name: achievement.displayName,
        apiname: achievement.name,
        icon: achievement.icon,
        icongray: achievement.icongray,
        description: achievement.description || "",
        completed: false,
    }));

    setToCache('achievements', cacheKey, transformedAchievements);
    return transformedAchievements;
}

export async function syncSteamAchievements(gameId, appId){
    if (steamId == null) steamId = getConfig().STEAM_USERID;
    if(steamApiKey == null) steamApiKey = getConfig().STEAM_API_KEY;
    const response = await fetch(`https://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v1/?appid=${appId}&key=${steamApiKey}&steamid=${steamId}`);
    const data = await response.json();
    if (!data || !data.playerstats || !data.playerstats.achievements) {
        return
    }

    const achievedSet = new Set(
        data.playerstats.achievements
            .filter(a => a.achieved == 1)
            .map(a => a.apiname)
    );

    const game = await gamesServices.getGameWithProgress(gameId);
    const achievements = game.achievements || [];

    const newlyUnlocked = [];

    for (const ach of achievements) {
        const shouldBeCompleted = achievedSet.has(ach.apiname);
        if (ach.completed !== shouldBeCompleted) {
            await gamesServices.toggleAchievementCompleted(gameId, ach.name);
            if (shouldBeCompleted) {
                newlyUnlocked.push({
                    achievementName: ach.name,
                    imageUrl: ach.icon,
                    gameName: game.name
                  });
            }
        }
    }

    console.log(`Sincronizado: ${game.name}`);
    return newlyUnlocked;
}

//console.log("Initial", await syncSteamAchievements(1687950));