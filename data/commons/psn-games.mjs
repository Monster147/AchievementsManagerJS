import * as psn from 'psn-api';
import dotenv from 'dotenv';
import { getConfig } from "../../common/configFunctions.mjs";
dotenv.config();

let authorization = null;
let tokenExpiresAt = 0;

const psnCache = [];

async function ensureAuthenticated() {
    const now = Date.now();

    if (authorization && now < tokenExpiresAt) {
        return;
    }

    if (authorization?.refreshToken) {
        authorization = await psn.exchangeRefreshTokenForAuthTokens(
            authorization.refreshToken
        );
    } else {
        const myNpsso = getConfig().PSN_API_KEY;
        const accessCode = await psn.exchangeNpssoForAccessCode(myNpsso);
        authorization = await psn.exchangeAccessCodeForAuthTokens(accessCode);
    }

    tokenExpiresAt = now + (authorization.expiresIn ?? 3600) * 1000;
}

export async function searchPSNGameByName(name) {
    await ensureAuthenticated();
    const keywords = name.toLowerCase().split(/\s+/);

    if (psnCache.length > 0) {
        return psnCache.filter(game => {
            const gameName = game.name.toLowerCase();
            //console.log("Obtaining from cache")
            return keywords.every(keyword => gameName.includes(keyword));
        });
    }

    const userTitlesResponse = await psn.getUserTitles(
        { accessToken: authorization.accessToken },
        "me"
    );
    
    const processedTitles = userTitlesResponse.trophyTitles
        .map(item => {
            let rawGameId = item.npCommunicationId;
            if (rawGameId.endsWith("_00")) {
                rawGameId = rawGameId.slice(0, -3); // remove the last 3 chars "_00"
            }

            return {
                name: item.trophyTitleName,
                gameid: rawGameId,
                cover: item.trophyTitleIconUrl,
                source: 'psn'
            };
        });
    psnCache.push(...processedTitles);
        
    return processedTitles.filter(game => {
        const gameName = game.name.toLowerCase();
        return keywords.every(keyword => gameName.includes(keyword));
    });
}

export async function getPSNAchievements(gameId) {
    await ensureAuthenticated();
    //console.log('Fetching achievements for gameId:', gameId);
    const fullGameId = `${gameId}_00`;
    const response = await psn.getTitleTrophies(authorization, fullGameId, "all", {
        npServiceName: "trophy",
        headerOverrides: {
            "Accept-Language": "pt-PT"
        }
      });

    //console.log('Response:', response);
    return response.trophies.map(trophy => ({
        name: trophy.trophyName,
        icon: trophy.trophyIconUrl,
        icongray: "/assets/DEFAULT_ICON_GRAY.png",
        description: trophy.trophyDetail || "",
        completed: false,
    }));
}