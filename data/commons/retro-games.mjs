import {
  buildAuthorization,
  getGameInfoAndUserProgress,
  getGameExtended
} from "@retroachievements/api";

import dotenv from 'dotenv';
//import gamesDataInit from '../memory/data-memory.mjs';
import gamesDataInit from '../fileDB/data.mjs'
import gamesServicesInit from '../../services/services.mjs';
import searchDataInit from './search-games.mjs'
import { getConfig } from "../../common/configFunctions.mjs";

const searchData = searchDataInit();
const gamesData = gamesDataInit();
const gamesServices = gamesServicesInit(gamesData, searchData);

dotenv.config();
let username = null
let webApiKey = null  // Web API key for RetroAchievements
let authorization = null

const achievementsCache = [];  // Array-based cache for game search results

export async function getRetroAchievements(gameId) {
  if(username == null) username = getConfig().RETRO_USERNAME;
  if(webApiKey == null) webApiKey = getConfig().RETRO_API_KEY;
  if(authorization == null) authorization = buildAuthorization({ username, webApiKey });
  const cachedAchievements = achievementsCache.find(item => item.gameId === gameId);
    if (cachedAchievements) {
        //console.log("Returning cached achievements for game:", gameId);
        return cachedAchievements.achievements;
    }

  const gameExtended = await getGameExtended(authorization, {
    gameId: gameId,
  });

  const achievementsObj = gameExtended.achievements;
  const achievements = Object
    .values(achievementsObj)
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map(achievement => ({
      name: achievement.title,
      apiname: `${achievement.id}`,
      icon: `https://media.retroachievements.org/Badge/${achievement.badgeName}.png`,
      icongray: `https://media.retroachievements.org/Badge/${achievement.badgeName}_lock.png`,
      description: achievement.description || "",
      completed: false,
    }));

  achievementsCache.push({
    gameId,
    achievements
  });
  return achievements;
}

export async function syncRetroAchievements(gameArrayId, gameId){
  if(username == null) username = getConfig().RETRO_USERNAME;
  if(webApiKey == null) webApiKey = getConfig().RETRO_API_KEY;
  if(authorization == null) authorization = buildAuthorization({ username, webApiKey });
  const gameData = await getGameInfoAndUserProgress(authorization, {
    username: username,
    gameId: gameId,
  },);

  if (!gameData || !gameData.achievements) {
    return;
  }

  const achievedSet = new Set(
    Object.values(gameData.achievements)
        .filter(a => a.dateEarned != null)
        .map(a => a.id.toString())
  );
  
  const game = await gamesServices.getGameWithProgress(gameArrayId);
  const achievements = game.achievements || [];

  const newlyUnlocked = [];

  for (const ach of achievements) {
    const shouldBeCompleted = achievedSet.has(ach.apiname);
    if (ach.completed !== shouldBeCompleted) {
        await gamesServices.toggleAchievementCompleted(gameArrayId, ach.name);
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