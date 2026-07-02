const Pusher = require("pusher");

const pusher = new Pusher({
  appId: "2172967",
  key: "69bc9629d7ee161329fd",
  secret: "e281db0dd903fbea903c",
  cluster: "eu",
  useTLS: true,
});

module.exports = async (req, res) => {
  // Разрешаем запросы с любого домена (CORS)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  let body = req.body;

  // Если body пустой, пробуем прочитать его из потока (бывает в Vercel)
  if (!body || Object.keys(body).length === 0) {
    const buffers = [];
    for await (const chunk of req) { buffers.push(chunk); }
    const data = Buffer.concat(buffers).toString();
    try {
      // Пробуем распарсить как JSON или как URL-encoded
      if (data.startsWith('{')) {
        body = JSON.parse(data);
      } else {
        const params = new URLSearchParams(data);
        body = Object.fromEntries(params);
      }
    } catch (e) {
      console.error("Failed to parse body:", data);
    }
  }

  const socketId = body?.socket_id;
  const channel = body?.channel_name;
  
  if (!socketId || !channel) {
    return res.status(400).send('Missing socket_id or channel_name');
  }

  const presenceData = {
    user_id: "user-" + Math.random().toString(36).substring(2) + Date.now(),
    user_info: { name: "Player" }
  };

  try {
    const auth = pusher.authenticate(socketId, channel, presenceData);
    return res.send(auth);
  } catch (error) {
    console.error("Pusher Auth Error:", error);
    return res.status(403).send("Forbidden");
  }
};