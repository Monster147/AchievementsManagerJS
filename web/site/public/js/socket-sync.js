const socket = new WebSocket(`ws://${window.location.hostname}:3000/sync`);
let pendingAchievements = 0;

socket.onmessage = function (event) {
  const data = JSON.parse(event.data);
  switch (data.type) {
    case 'achievement-unlocked':
      if (Array.isArray(data.data)) {
        pendingAchievements += data.data.length;
        for (const achievement of data.data) {
          showAchievementNotification(achievement);
        }
      }
      break;

    case 'sync-complete':
      if (pendingAchievements === 0) {
        location.reload();
      } else {
        // Esperar até todos os popups desaparecerem
        setTimeout(() => location.reload(), 5000 * pendingAchievements);
      }
      break;
  }
};

const notificationQueue = [];
let isNotificationVisible = false;

function showAchievementNotification(data) {
  notificationQueue.push(data);
  if (!isNotificationVisible) {
    displayNextNotification();
  }
}

function displayNextNotification() {
  if (notificationQueue.length === 0) {
    isNotificationVisible = false;
    return;
  }

  isNotificationVisible = true;
  const data = notificationQueue.shift(); // Get the next notification from the queue

  const notification = document.createElement('div');
  notification.className = 'achievement-popup';

  notification.innerHTML = `
    <div class="popup-header">🏆 Achievement Unlocked!</div>
    <div class="popup-body">
        <img src="${data.imageUrl}" class="popup-image" alt="Achievement Image"/>
        <div class="popup-info">
            <div class="popup-title">${data.achievementName}</div>
            <div class="popup-game">From: <strong>${data.gameName}</strong></div>
        </div>
    </div>
  `;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
    pendingAchievements--;
    displayNextNotification();
  }, 5000);
}