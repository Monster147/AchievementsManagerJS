import { readTable, writeTable } from './db.mjs';
import { downloadAndSaveImage, deleteLocalImage } from '../../common/imageDownloader.mjs';

export default function init(){
    return {
        getAllGames,
        getGame,
        createGame,
        updateGame,
        deleteGame,
        addAchievementsToGame,
        getAchievements,  
        toggleAchievementCompleted,
        getGameProgress,
        getGameWithProgress
    };


  async function getAllGames() {
    const games = await readTable('games', []);
    const result = [];
    for (const game of games) result.push(await getGameWithProgress(game.id));
    return result;
  }

  async function getGame(id) {
    const games = await readTable('games', []);
    return games.find(g => g.id == id);
  }

  async function createGame(game) {
    const games = await readTable('games', []);
    game.id = Date.now().toString();
    games.push(game);
    await writeTable('games', games);
    return game;
  }

  async function updateGame(id, data) {
    const games = await readTable('games', []);
    const idx = games.findIndex(g => g.id == id);
    if (idx === -1) return null;

    const oldGame = games[idx];
    
    if (data.cover && data.cover !== oldGame.cover) {
      if (oldGame.cover && !oldGame.cover.startsWith('http')) {
        deleteLocalImage(oldGame.cover);
      }
      data.cover = await downloadAndSaveImage(data.cover, data.name || oldGame.name);
    }

    games[idx] = { ...games[idx], ...data };
    await writeTable('games', games);
    return games[idx];
  }

  async function deleteGame(id) {
     const games = await readTable('games', []);
    const idx = games.findIndex(g => g.id == id);
    if (idx === -1) return false;

    const { gameid, cover } = games[idx];
    
    // Delete associated cover image if it's local
    if (cover && !cover.startsWith('http')) {
      deleteLocalImage(cover);
    }

    games.splice(idx, 1);
    await writeTable('games', games);

    // Delete related achievements
    let achievements = await readTable('achievements', []);
    achievements = achievements.filter(a => a.game_id != gameid);
    await writeTable('achievements', achievements);

    // Delete related progress
    let progress = await readTable('game_progress', []);
    progress = progress.filter(p => p.game_id != gameid);
    await writeTable('game_progress', progress);

    return true;
  }

  async function addAchievementsToGame(gameid, achievements) {
    const db = await readTable('achievements', []);
    for (const ach of achievements) {
      if (db.some(a => a.game_id == gameid && a.name == ach.name)) continue;
      db.push({ ...ach, game_id: gameid, completed: false });
    }
    await writeTable('achievements', db);
  }

  async function getAchievements(gameid) {
    const db = await readTable('achievements', []);
    return db.filter(a => a.game_id == gameid);
  }

  async function toggleAchievementCompleted(gameid, achievementName) {
    const achDb = await readTable('achievements', []);
    const achievement = achDb.find(a => a.game_id == gameid && a.name == achievementName);
    if (!achievement) throw new Error('Achievement not found');
    achievement.completed = !achievement.completed;
    await writeTable('achievements', achDb);

    const progDb = await readTable('game_progress', []);
    let progress = progDb.find(p => p.game_id == gameid);
    if (!progress) {
      progress = { game_id: `${gameid}`, completed_achievements: [] };
      progDb.push(progress);
    }

    if (achievement.completed) {
      if (!progress.completed_achievements.includes(achievementName)) {
        progress.completed_achievements.push(achievementName);
      }
    } else {
      progress.completed_achievements = progress.completed_achievements.filter(a => a != achievementName);
    }

    await writeTable('game_progress', progDb);
    return achievement.completed;
  }

  async function getGameProgress(gameid) {
    const db = await readTable('game_progress', []);
    let progress = db.find(p => p.game_id == gameid);
    if (!progress) {
      progress = { game_id: `${gameid}`, completed_achievements: [] };
      db.push(progress);
      await writeTable('game_progress', db);
    }
    return progress.completed_achievements;
  }

  async function getGameWithProgress(id) {
    const game = await getGame(id);
    if (!game) throw new Error('Game not found');

    const achievements = await getAchievements(game.gameid);
    const completed = await getGameProgress(game.gameid);

    return {
      ...game,
      achievements: achievements.map(a => ({
        ...a,
        completed: completed.includes(a.name)
      }))
    };
  }

}