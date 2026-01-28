const menu = require('./menu');


const sessions = new Map(); // deviceId => { currentOrder: [], orderHistory: [] }

function getOrCreateSession(deviceId) {
  if (!sessions.has(deviceId)) {
    sessions.set(deviceId, { currentOrder: [], orderHistory: [] });
  }
  return sessions.get(deviceId);
}

function addItemToOrder(deviceId, itemId) {
  const item = menu.find(m => m.id === parseInt(itemId));
  if (!item) return false;
  const session = getOrCreateSession(deviceId);
  session.currentOrder.push(item);
  return true;
}

function clearCurrentOrder(deviceId) {
  const session = getOrCreateSession(deviceId);
  session.currentOrder = [];
}

function checkoutOrder(deviceId) {
  const session = getOrCreateSession(deviceId);
  if (session.currentOrder.length === 0) return false;
  session.orderHistory.push({
    id: Date.now().toString(),
    items: [...session.currentOrder],
    total: session.currentOrder.reduce((sum, item) => sum + item.price, 0),
    timestamp: new Date().toISOString()
  });
  session.currentOrder = [];
  return true;
}

function getOrderHistory(deviceId) {
  return getOrCreateSession(deviceId).orderHistory;
}

function getCurrentOrder(deviceId) {
  return getOrCreateSession(deviceId).currentOrder;
}

module.exports = {
  getOrCreateSession,
  addItemToOrder,
  clearCurrentOrder,
  checkoutOrder,
  getOrderHistory,
  getCurrentOrder
};