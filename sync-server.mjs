import { WebSocketServer } from "ws";

export const notifications = [];

const wss = new WebSocketServer({ port: 3000, path: "/sync" });

const clients = new Set();

wss.on("connection", (ws) => {
  clients.add(ws);

  ws.on("close", () => {
    clients.delete(ws);
  });
});

export function notifyClients(data) {
  if(data.data){
    for(const ach of data.data){
    notifications.push({
      name: ach.achievementName,
      game: ach.gameName,
      image: ach.imageUrl,
      time: new Date().toLocaleString('pt-PT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
})
    });
  }
  }
  const json = JSON.stringify(data);
  for (const client of clients) {
    if (client.readyState === 1) {
      client.send(json);
    }
  }
}



