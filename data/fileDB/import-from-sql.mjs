/*import fs from 'fs';
import path from 'path';

const sql = fs.readFileSync(path.resolve('data/sql/export.sql'), 'utf8');

// --- GAMES ---
const games = [];
const gameRegex = /INSERT INTO games\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\);/gi;
let match;
while ((match = gameRegex.exec(sql))) {
  const columns = match[1].split(',').map(c => c.trim());
  const values = parseSqlValues(match[2]);
  const obj = {};
  columns.forEach((col, i) => obj[col] = values[i]);
  obj.id = obj.gameid; // Use gameid as id for fileDB
  games.push(obj);
}

// --- ACHIEVEMENTS ---
const achievements = [];
const achRegex = /INSERT INTO achievements\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\);/gi;
while ((match = achRegex.exec(sql))) {
  const columns = match[1].split(',').map(c => c.trim());
  const values = parseSqlValues(match[2]);
  const obj = {};
  columns.forEach((col, i) => obj[col] = values[i]);
  achievements.push(obj);
}

// --- GAME PROGRESS ---
const gameProgress = [];
const progRegex = /INSERT INTO game_progress\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\);/gi;
while ((match = progRegex.exec(sql))) {
  const columns = match[1].split(',').map(c => c.trim());
  const values = parseSqlValues(match[2]);
  const obj = {};
  columns.forEach((col, i) => {
    // Handle ARRAY[...] for completed_achievements
    if (col === 'completed_achievements' && typeof values[i] === 'string' && values[i].startsWith('ARRAY[')) {
      obj[col] = parseArray(values[i]);
    } else {
      obj[col] = values[i];
    }
  });
  gameProgress.push(obj);
}

// --- HELPERS ---
function parseSqlValues(valuesStr) {
  // Split by comma, but ignore commas inside quotes or arrays
  const regex = /'(?:[^']|'')*'|ARRAY\[[^\]]*\]|[^,]+/g;
  return Array.from(valuesStr.matchAll(regex)).map(match => {
    let v = match[0].trim();
    if (v === 'false') return false;
    if (v === 'true') return true;
    if (v === 'NULL') return null;
    if (v.startsWith("'") && v.endsWith("'")) {
      // Remove single quotes and unescape
      v = v.slice(1, -1).replace(/''/g, "'");
    }
    return v;
  });
}

function parseArray(arrStr) {
  // Remove ARRAY[ and ] and split respecting quoted strings
  // Example: ARRAY['A','B','C'] → ["A", "B", "C"]
  const inner = arrStr.replace(/^ARRAY\[/, '').replace(/\]$/, '');
  // Match all quoted strings, including those with escaped single quotes
  const regex = /'(?:[^']|'')*'/g;
  const matches = inner.match(regex);
  if (!matches) return [];
  return matches.map(s =>
    s.slice(1, -1).replace(/''/g, "'")
  );
}

// --- WRITE FILES ---
const dbDir = path.resolve('db');
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir);

fs.writeFileSync(path.join(dbDir, 'games.json'), JSON.stringify(games, null, 2), 'utf8');
fs.writeFileSync(path.join(dbDir, 'achievements.json'), JSON.stringify(achievements, null, 2), 'utf8');
fs.writeFileSync(path.join(dbDir, 'game_progress.json'), JSON.stringify(gameProgress, null, 2), 'utf8');

console.log('Imported games:', games.length);
console.log('Imported achievements:', achievements.length);
console.log('Imported game_progress:', gameProgress.length);*/

const sql = `
INSERT INTO game_progress (game_id, completed_achievements) VALUES ('2208920', ARRAY['The Saga Begins']);
INSERT INTO game_progress (game_id, completed_achievements) VALUES ('NPWR00660_00', ARRAY['Good Eats', 'Good Riot', 'Stunt Man']);
INSERT INTO game_progress (game_id, completed_achievements) VALUES ('NPWR00894_00', ARRAY['The Birth of an Assassin', 'Arrivederci Abstergo', 'Welcome to the Animus 2.0']);
INSERT INTO game_progress (game_id, completed_achievements) VALUES ('1850570', ARRAY['Delivering Is What I Do', 'Rebuilding America', 'We Need You', 'I Won''t Break', 'BB...', 'Everyday Delivery', 'The Automation Revolution', 'Apprentice Builder', 'A New Day for the UCA', 'Well Connected', 'Like and Be Liked', 'The People''s Porter', 'Good Samaritan', 'Chiral Crafter', 'A Thirst for Knowledge', 'The Custom Kid', 'Pathfinder', 'A Baby Blessing', 'Catcher Crusher', 'Snooze ''n'' Soothe', 'Boots Are a Porter''s Best Friend', 'Sleep Tight, Little BB', 'I Couldn''t Hold it In!', 'All Roads Lead to the UCA', 'Soothing Sounds']);
INSERT INTO game_progress (game_id, completed_achievements) VALUES ('631510', ARRAY['Blue Demon', 'Bookworm', 'Thunderstruck', 'Squashed Like A Bug', 'Arachnophobia', 'Can You Keep A Secret?', 'Bird of Prey', 'You''re No Angel', 'Seeing Red', 'Broken Halo', 'Cold Turkey', 'Gun Collector', 'Plucked', 'Night Terrors', 'Fallen Angel', 'Good Night', 'The Devil Went Down To...', 'The Nightmare is Over', 'Warming Up!', 'Table Of Contents', 'Blood Flows Red', 'A Secret Revealed ', 'Monkeying Around', 'No Joke', 'Stylish!', 'Sin City', 'That''s A Big Mother...', 'Hungry Like the Wolves', 'Ball ''n Chain', 'Full Armory', 'Not Just Any Ordinary Human', 'Never Forget a Face', 'Every Knee Will Bend', 'Extinguished', 'Devilish Deed', 'Man''s Best Friend', 'Pest Control', 'Double Trouble', 'Sibling Rivalry', 'Inside Out', 'Lightning In A Bottle', 'Lights Out', 'Rough Rider', 'Brotherly Love', 'That''s Not Lady-Like', 'Worst Kept Secret', 'Locked ''n Loaded', 'Who''s Laughing Now?', 'Asylum', 'Step Into The Light', 'Hell of a Start']);
INSERT INTO game_progress (game_id, completed_achievements) VALUES ('5613', ARRAY['Yo Noobie', 'Welcome to Bayview', 'Bring My Car Back... Now!', 'Making a Name']);
INSERT INTO game_progress (game_id, completed_achievements) VALUES ('3887', ARRAY['Bedroom Blitz']);
INSERT INTO game_progress (game_id, completed_achievements) VALUES ('242050', ARRAY['Heroes Aren''t Born', 'Silence, Fool!', 'Excavator', 'Owned', 'Good While It Lasted', 'Employee Of The Month', 'All Aboard!', 'Business And Pleasure', 'Wild West Indies', 'A Pirate''s Life For Me', 'Routine Hacking', 'Killer Killer', 'Help A Brother Out', 'No Apologies', 'Mer-man', 'Death Of A Salesman', 'Mixing Up The Medicines', 'Getting Weird Around Here', 'The Hammer Falls', 'Adrift', 'A New Hope', 'Sharing Is Caring', 'King Of The Castle', 'Barfly', 'My Elusive Fortune', 'Bunker Buddies', 'Vault Raider', 'Been Down So Long...', 'Just Like Starting Over', 'It''s All Good', 'Saw That One Coming...', 'FTFY']);
INSERT INTO game_progress (game_id, completed_achievements) VALUES ('1888930', ARRAY['Fallen Firefly', 'Self-Help', 'In Memoriam', 'Savage Starlight Fan', 'Geared Up', 'Lights Out', 'Waterlogged', 'Combat Ready', 'Sticky Fingers', 'Left Hanging', 'Who''s A Good Boy?', 'Sharpest Tool in the Shed', 'No Matter What']);
INSERT INTO game_progress (game_id, completed_achievements) VALUES ('19040', ARRAY['Veblensk City Street', 'Treneska Border Crossing', '[KILLS] Treneska Border Crossing', 'AK-47 Expert', 'Walther 2000 Expert', 'Uzi Expert', 'Naszran Town', '[KILLS] Naszran Town']);
INSERT INTO game_progress (game_id, completed_achievements) VALUES ('552520', ARRAY['The Spark']);
INSERT INTO game_progress (game_id, completed_achievements) VALUES ('20535', ARRAY['Ludicrous Display', 'Ready to Rumble']);
INSERT INTO game_progress (game_id, completed_achievements) VALUES ('729040', ARRAY['Paid in Fyrestone', 'Ding! Newbie', 'Discovered Skag Gully', 'Rootinest, Tootinest, Shootinest', 'Ding! Novice', 'Down in Front!', 'My Brother is an Italian Plumber', 'Wanted: Sledge', 'Discovered Sledge''s Safe House', 'Discovered Headstone Mine', 'Fence', '1.21 Gigawatts', 'Pyro', 'There are some who call me...Tim', 'You call this archaeology?', 'Get A Little Blood on the Tires', 'Ding! Expert', 'Made in Fyrestone', 'Master Exploder', 'Weapon Aficionado', 'Fully Loaded', 'Paid in New Haven', 'Discovered The Scrapyard', 'Discovered Krom''s Canyon', 'Wanted: Krom', 'Pandora-dog Millionaire', 'Ding! Hardcore', 'Discovered Trash Coast', 'Destroyed the Hive', 'Wanted: Flynt', 'Made in New Haven', 'Discovered Crimson Lance Enclave', 'Discovered Eridian Promontory', 'Destroyed the Destroyer', 'House of the Ned', 'Ding! Sleepless', 'Jakobs Fodder', 'Night of the Living Ned', 'Ned''s Undead, Baby, Ned''s Undead', 'Making a Monster']);
`;

const result = [...sql.matchAll(/VALUES\s*\(\s*'([^']+)'\s*,\s*ARRAY\[(.*?)\]\);/gs)].map(match => {
  const game_id = match[1];
  const raw = match[2];

  // Quebra manual e limpa os elementos, respeitando aspas simples
  const entries = [];
  let current = '';
  let inside = false;
  for (let i = 0; i < raw.length; i++) {
    const char = raw[i];
    const next = raw[i + 1];

    if (char === "'" && next === "'") {
      current += "'"; // é um apóstrofo real
      i++; // salta o segundo '
    } else if (char === "'") {
      inside = !inside;
      if (!inside) {
        entries.push(current);
        current = '';
        while (raw[i + 1] === ',' || raw[i + 1] === ' ') i++; // ignora vírgulas e espaços
      }
    } else if (inside) {
      current += char;
    }
  }

  return {
    game_id,
    completed_achievements: entries
  };
});

console.log(JSON.stringify(result, null, 2));