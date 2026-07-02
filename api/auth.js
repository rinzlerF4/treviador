const Pusher = require("pusher");

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER || "eu",
  useTLS: true,
});

module.exports = async (req, res) => {
  // Добавляем заголовки для CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // В Vercel body может прийти как строка или как объект
  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  
  const socketId = body.socket_id;
  const channel = body.channel_name;
  
  if (!socketId || !channel) {
    res.status(400).send('Missing socket_id or channel_name');
    return;
  }

  const presenceData = {
    user_id: Math.random().toString(36).slice(2),
    user_info: { name: "Player" }
  };

  try {
    const auth = pusher.authenticate(socketId, channel, presenceData);
    res.send(auth);
  } catch (error) {
    console.error("Pusher auth error:", error);
    res.status(403).send("Forbidden");
  }
};

  try {
    const auth = pusher.authenticate(socketId, channel, presenceData);
    return res.send(auth);
  } catch (error) {
    console.error("Pusher auth error:", error);
    return res.status(403).send("Forbidden");
  }
};