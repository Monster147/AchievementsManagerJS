# Achievement Manager in JS

A WebApp that manages achievements unlocked in a game, native in PC (through
Steam), emulated (any emulator with an integration with RetroAchievements) or
a game played in a PlayStation console, starting from the PS3. Made in JS.

## Instalation

If you want to install, download the release.

First make sure you have Node.js installed in your PC if you don't, donwload it first (https://nodejs.org/en/download),
after that do a `npm install` in the project root folder on your PC.

Create a file named `.env` in the root folder (where the file `server.mjs` is), and put like this:
```
PORT=<PortNumber> (ex.: 8080, 8081, 9000, 3000)
```

Execute the bat file, start-server.bat, and it will open your browser with the WebApp.

If you want to search and sync a game native to PC you need to first, go to
the `Set Config` page and put your Steam API Key 
(you can get one here: https://steamcommunity.com/dev/apikey), and also introduce
your Steam ID.

For PSN, follow the steps below:

1. In your web browser, visit the PlayStation homepage, click the "Sign In" button, and log in with a PSN account.

2. In the same browser (due to a persisted cookie), visit this page. You will see a JSON response that looks something like:

```
{ "npsso": "<64 character token>" }
```

3. Copy the token to the PSN API Key input and your good to go

For RetroAchievements, follow this steps:

1. Go to the RetroAchievements website, log in, and then go to your account settings

2. Scroll down, until you have found the `Authentication` card

3. Copy your Web API Key, and put it in the input for it

With this all done your setup for everything
