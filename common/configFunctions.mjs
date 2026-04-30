import fs from 'fs';
const configPath = './common/config.json';

export function getConfig() {
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
}

export function setConfig(newConfig) {
    fs.writeFileSync(configPath, JSON.stringify(newConfig, null, 2));
}