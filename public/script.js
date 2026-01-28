let deviceId = localStorage.getItem('deviceId');
const socket = io({ query: { deviceId } });

const chatBox = document.getElementById('chat');
const input = document.getElementById('input');
const sendBtn = document.getElementById('send');

socket.on('assignDeviceId', (id) => {
  deviceId = id;
  localStorage.setItem('deviceId', id);
});

socket.on('message', (msg) => {
  const div = document.createElement('div');
  div.className = `message ${msg.sender}`;
  div.textContent = msg.text;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
});

sendBtn.onclick = sendMessage;
input.onkeypress = (e) => {
  if (e.key === 'Enter') sendMessage();
};

function sendMessage() {
  const text = input.value.trim();
  if (!text) return;
  socket.emit('userMessage', { text });
  input.value = '';
}