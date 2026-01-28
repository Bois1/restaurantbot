require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
const { v4: uuidv4 } = require('uuid');


const menu = require('./menu');
const {
  addItemToOrder,
  clearCurrentOrder,
  checkoutOrder,
  getOrderHistory,
  getCurrentOrder
} = require('./orders');
const { initializePayment } = require('./paystack');

const app = express();
app.use(cors());
app.use(express.static(path.join(__dirname, '../public')));
app.use(express.json());

const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: "*" }
});


app.get('/payment/callback', (req, res) => {
  const { reference, status } = req.query;
  if (status === 'success') {
   
    res.send(`
      <h2>Payment Successful!</h2>
      <p>Reference: ${reference}</p>
      <a href="/">Back to Chatbot</a>
    `);
  } else {
    res.send('<h2>Payment Failed</h2><a href="/">Try Again</a>');
  }
});


app.post('/webhook/paystack', express.raw({ type: 'application/json' }), (req, res) => {
  console.log('Webhook received:', req.body.toString());
  res.status(200).send();
});

io.on('connection', (socket) => {
  let deviceId = socket.handshake.query.deviceId;
  if (!deviceId) {
    deviceId = uuidv4();
    socket.emit('assignDeviceId', deviceId);
  }

  const sendOptions = () => {
    socket.emit('message', {
      sender: 'bot',
      text: `Welcome! Please select an option:\n\n` +
            `1 → Place an order\n` +
            `99 → Checkout order\n` +
            `98 → See order history\n` +
            `97 → See current order\n` +
            `0 → Cancel order`
    });
  };

  sendOptions();

  socket.on('userMessage', async (data) => {
    const input = data.text.trim();
    socket.emit('message', { sender: 'user', text: input });

    const reply = (text) => socket.emit('message', { sender: 'bot', text });

    if (input === '1') {
      let menuText = 'Select item number to add:\n';
      menu.forEach(item => {
        menuText += `${item.id}. ${item.name} - ₦${item.price}\n`;
      });
      menuText += `\nType item number (e.g., "1") or "back" to return.`;
      reply(menuText);
      socket.on('menuItemSelect', handleItemSelect);
    } 
    else if (input === '99') {
      const success = checkoutOrder(deviceId);
      if (success) {
        const history = getOrderHistory(deviceId);
        const lastOrder = history[history.length - 1];
        const total = lastOrder.total;
  
        try {
          const callbackUrl = `${process.env.BASE_URL}/payment/callback`;
          const paymentUrl = await initializePayment('customer@example.com', total, lastOrder.id, callbackUrl);
          reply(`Order placed! Total: ₦${total}\n\n Pay now: ${paymentUrl}\n\nOr type "new" for another order.`);
        } catch (err) {
          reply(`Order placed! Total: ₦${total}\n\n Payment setup failed. Contact support.`);
        }
      } else {
        reply('No order to place.\n\nType "1" to start a new order.');
      }
    }
    else if (input === '98') {
      const history = getOrderHistory(deviceId);
      if (history.length === 0) {
        reply('No order history yet.');
      } else {
        let histText = 'Order History:\n';
        history.forEach(order => {
          histText += `\nOrder #${order.id} (₦${order.total})\n`;
          order.items.forEach(item => histText += `- ${item.name}\n`);
        });
        reply(histText);
      }
    }
    else if (input === '97') {
      const current = getCurrentOrder(deviceId);
      if (current.length === 0) {
        reply('🛒 Your cart is empty. Type "1" to add items.');
      } else {
        let cartText = '🛒 Current Order:\n';
        let total = 0;
        current.forEach(item => {
          cartText += `- ${item.name} (₦${item.price})\n`;
          total += item.price;
        });
        cartText += `\nTotal: ₦${total}`;
        reply(cartText);
      }
    }
    else if (input === '0') {
      clearCurrentOrder(deviceId);
      reply('🗑️ Current order cancelled.\n\nType "1" to start over.');
    }
    else {
     
      const num = parseInt(input);
      if (!isNaN(num) && num >= 1 && num <= menu.length) {
        addItemToOrder(deviceId, num);
        reply(`Added: ${menu[num - 1].name}\n\nType another item number, or "97" to view cart.`);
      } else {
        reply('Invalid option. Please choose from the main menu.');
        sendOptions();
      }
    }
  });

  function handleItemSelect(itemInput) {
    const num = parseInt(itemInput);
    if (!isNaN(num) && num >= 1 && num <= menu.length) {
      addItemToOrder(deviceId, num);
      reply(`Added: ${menu[num - 1].name}\n\nType another item number, or "97" to view cart.`);
    } else if (itemInput === 'back') {
      socket.off('menuItemSelect', handleItemSelect);
      sendOptions();
    } else {
      reply('Invalid item. Try again or type "back".');
    }
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});