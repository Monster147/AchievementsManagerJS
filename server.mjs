'use strict';

const originalLog = console.log;
const logBuffer = [];
const MAX_LOGS = 500;

console.log = (...args) => {
  const timestamp = `[${new Date().toLocaleString()}]`;
  const msg = [timestamp, ...args].join(' ');

  logBuffer.push(msg);
  if (logBuffer.length > MAX_LOGS) logBuffer.shift();
  originalLog(timestamp, ...args);
};

export function getLogs() {
  return logBuffer;
}

import './sync-server.mjs';
import open from 'open';
import os from 'os';
import express from 'express';
import swaggerUi from 'swagger-ui-express';
import yaml from 'yamljs';
import dotenv from 'dotenv'; // Importa o módulo 'dotenv' para carregar variáveis de ambiente de um arquivo .env
import cors from 'cors';
import hbs from 'hbs';
import path from 'path';
import url from 'url';
import { syncAchievements } from './data/commons/search-games.mjs';
import backupRoutesInit from './web/backup/web-backup.mjs';

import { notifyClients } from './sync-server.mjs';

// Carrega as variáveis de ambiente do arquivo .env
dotenv.config();

const PORT = process.env.PORT;

const CURRENT_DIR = url.fileURLToPath(new URL('.', import.meta.url));
const PATH_PUBLIC = path.join(CURRENT_DIR, 'web', 'site', 'public');
const PATH_VIEWS = path.join(CURRENT_DIR, 'web', 'site', 'views');
const PATH_PARTIALS = path.join(PATH_VIEWS, 'partials');

const createTableData = "./data/sql/createDomainSchema.sql";
const importData = "./data/sql/export.sql";

let gamesAPI = undefined
let gamesSite = undefined
let backupSite = undefined

import searchDataInit from './data/commons/search-games.mjs';
//import gamesDataInit from './data/memory/data-memory.mjs';
import gamesDataInit from './data/fileDB/data.mjs'
import gamesServicesInit from './services/services.mjs';
import gamesAPIInit from './web/API/web-api.mjs';
import gamesSiteInit from './web/site/web-site.mjs';

try{
  const searchData = searchDataInit();
  const gamesData = gamesDataInit();
  const gamesServices = gamesServicesInit(gamesData, searchData);
  gamesAPI = gamesAPIInit(gamesServices);
  gamesSite = gamesSiteInit(gamesServices);
  backupSite = backupRoutesInit(CURRENT_DIR);
} catch (e) {
  console.error("Error initializing gamesAPI:", e);
  process.exit(1); // Exit the process with an error code
}

if(gamesAPI && gamesSite && backupSite) {
  const app = express();

  app.use(express.static(PATH_PUBLIC));

  app.set('views', PATH_VIEWS);
  app.set('view engine', 'hbs');
  hbs.registerPartials(PATH_PARTIALS);
  hbs.registerHelper('lt', function (a, b) {
    return parseFloat(a) < parseFloat(b);
  });
  hbs.registerHelper('range', function(start, end) {
    let range = [];
    for (let i = start; i <= end; i++) {
      range.push(i);
    }
    return range;
  });
  hbs.registerHelper('eq', function (a, b) {
    return a == b;
  });
  hbs.registerHelper('groupByPlatform', function (games, options) {
    const grouped = {};
  
    games.forEach(game => {
      let platform = game.platform;
  
      // Simplificação para as plataformas PlayStation
      if (/playstation\s*1/i.test(platform)) platform = 'PS1';
      else if (/playstation\s*2/i.test(platform)) platform = 'PS2';
      else if (/playstation\s*3/i.test(platform)) platform = 'PS3';
      else if (/playstation\s*portable|psp/i.test(platform)) platform = 'PSP';
  
      if (!grouped[platform]) grouped[platform] = [];
      grouped[platform].push(game);
    });
  
    let result = '';
    for (const platform in grouped) {
      result += options.fn({ platform, games: grouped[platform] });
    }
  
    return result;
  });

  hbs.registerHelper('includes', function(str, search, options) {
    if (!str || !search) return false;
    return str.toLowerCase().includes(search.toLowerCase());
  });

  const swaggerDocument = yaml.load(path.join(CURRENT_DIR, 'docs', 'api.yaml'));

  app.use('/api-doc', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

  app.use(cors());

  app.use('/assets', express.static('assets'));
  app.use('/css', express.static('css'));
    
  app.use(express.json());

  app.use(express.urlencoded({extended: false}));

  app.use("/site/homepage", gamesSite.homepage);

  app.use("/site/games/custom", gamesSite.createCustomGame);

  app.get("/site/config", gamesSite.setValues);
  app.post("/site/config/update", gamesSite.configValues);

  app.get('/api/backup/export', backupSite.exportApi);
  app.post('/api/backup/import', backupSite.importApi);
  app.get('/site/backup/export', backupSite.exportSite);
  app.post('/site/backup/import', backupSite.importSite);

  app.get("/games", gamesAPI.getAllGames);
  app.get("/site/games", gamesSite.getAllGames);

  app.post("/games", gamesAPI.createGame);
  app.post("/site/games", gamesSite.createGame);

  app.use("/site/search", gamesSite.searchGames);

  app.post("/games/search", gamesAPI.searchGamesByName);
  app.post("/site/games/search", gamesSite.searchGamesByName);

  app.get("/games/:id", gamesAPI.getGame);
  app.get('/site/games/:id', gamesSite.getGame);

  app.post("/games/:id/search/:gameid/achievements", gamesAPI.getAchievements);
  app.post('/site/games/:id/search/:gameid/achievements', gamesSite.getAchievements);

  app.put("/games/:id", gamesAPI.updateGame);
  app.post("/site/games/:id/update", gamesSite.updateGame);

  app.delete("/games/:id", gamesAPI.deleteGame);
  app.post("/site/games/:id/delete", gamesSite.deleteGame);

  app.post("/games/:id/achievements", gamesAPI.toggleAchievementCompleted);
  app.post("/site/games/:id/achievements", gamesSite.toggleAchievementCompleted);

  app.use("/site/notifications", gamesSite.showNotifications);

  app.post('/site/games/:id/toggle-sync', gamesSite.toggleSynchronize);

  app.get('/site/logs', gamesSite.seeLogs);

  app.use("/site*", gamesSite.handlerError);

  function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        if (iface.family === 'IPv4' && !iface.internal) {
          return iface.address;
        }
      }
    }
   return 'localhost';
  }

  app.listen(PORT, () => {
      const localIP = getLocalIP();
      console.log(`Servidor disponível em:`);
      console.log(`→ Localhost: http://localhost:${PORT}/site/homepage`);
      console.log(`→ IP local: http://${localIP}:${PORT}/site/homepage`);
      open(`http://localhost:${PORT}/site/homepage`);
    }
  );

  setInterval(async () => {
    console.log("A sincronizar conquistas...");
    await syncAchievements();

    notifyClients({ type: "sync-complete" });
  }, 1000 * 60 * 10);
}