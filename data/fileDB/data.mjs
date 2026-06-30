import { readTable, writeTable, updateTable } from './db.mjs';
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
        getGameWithProgress,
        deleteAchievements
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
    game.id = Date.now().toString();
    await updateTable('games', (games) => {
      games.push(game);
      return { data: games, result: game };
    });
    return game;
  }

  async function updateGame(id, data) {
    const games = await readTable('games', []);
    const oldGame = games.find(g => g.id == id);
    if (!oldGame) return null;
    
    if (data.cover && data.cover !== oldGame.cover) {
      if (oldGame.cover && !oldGame.cover.startsWith('http')) {
        deleteLocalImage(oldGame.cover);
      }
      data.cover = await downloadAndSaveImage(data.cover, data.name || oldGame.name);
    }

    return updateTable('games', (gms) => {
      const idx = gms.findIndex(g => g.id == id);
      if (idx === -1) return { data: gms, result: null };
      gms[idx] = { ...gms[idx], ...data };
      return { data: gms, result: gms[idx] };
    });
  }

  async function deleteGame(id) {
    let removed = null;
    const ok = await updateTable('games', (games) => {
      const idx = games.findIndex(g => g.id == id);
      if (idx === -1) return { data: games, result: false };
      removed = games[idx];
      if (removed.cover && !removed.cover.startsWith('http')) {
        deleteLocalImage(removed.cover);
      }
      games.splice(idx, 1);
      return { data: games, result: true };
    });
    if (!ok) return false;

    const gameid = removed.gameid;
    await updateTable('achievements', (a) => ({ data: a.filter(x => x.game_id != gameid), result: null }));
    await updateTable('game_progress', (p) => ({ data: p.filter(x => x.game_id != gameid), result: null }));
    return true;
  }

  async function addAchievementsToGame(gameid, achievements) {
    await updateTable('achievements', (db) => {
      for (const ach of achievements) {
        if (db.some(a => a.game_id == gameid && a.apiname == ach.apiname)) continue;
        db.push({ ...ach, game_id: gameid, completed: false });
      }
      return { data: db, result: null };
    });

    await updateTable('game_progress', (progDb) => {
    if (!progDb.find(p => p.game_id == gameid)) {
      progDb.push({ game_id: `${gameid}`, completed_achievements: [] });
    }
    return { data: progDb, result: null };
  });
  }

  async function getAchievements(gameid) {
    const db = await readTable('achievements', []);
    return db.filter(a => a.game_id == gameid);
  }

  async function deleteAchievements(gameid) {
    await updateTable('achievements', (a) => ({ data: a.filter(x => x.game_id != gameid), result: null }));
  }

  async function toggleAchievementCompleted(gameid, identifier) {
    let nowCompleted;
    let key;
    await updateTable('achievements', (achDb) => {
      const achievement = achDb.find(a => a.game_id == gameid && (a.apiname == identifier || a.name == identifier));
      if (!achievement) throw new Error('Achievement not found');
      achievement.completed = !achievement.completed;
      nowCompleted = achievement.completed;
      key = achievement.apiname || achievement.name;
      return { data: achDb, result: null };
    });

    await updateTable('game_progress', (progDb) => {
      let progress = progDb.find(p => p.game_id == gameid);
      if (!progress) {
        progress = { game_id: `${gameid}`, completed_achievements: [] };
        progDb.push(progress);
      }
      if (nowCompleted) {
        if (!progress.completed_achievements.includes(key)) {
          progress.completed_achievements.push(key);
        }
      } else {
        progress.completed_achievements = progress.completed_achievements.filter(a => a != key);
      }
      return { data: progDb, result: null };
    });

    return nowCompleted;
  }

  async function getGameProgress(gameid) {
    const db = await readTable('game_progress', []);
    let progress = db.find(p => p.game_id == gameid);
    if (!progress) {
      progress = { game_id: `${gameid}`, completed_achievements: [] };
      await updateTable('game_progress', (d) => {
          if (!d.find(p => p.game_id == gameid)) d.push(progress);
          return { data: d, result: null };
      });
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
        completed: completed.includes(a.apiname || a.name)
      }))
    };
  }

}