const Pusher = require("pusher");

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: "eu",
  useTLS: true,
});

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) {}
  }

  const socketId = body?.socket_id;
  const channel = body?.channel_name;

  if (!socketId || !channel) {
    return res.status(400).send('Missing params');
  }

  const presenceData = {
    user_id: "user-" + Math.random().toString(36).slice(2),
    user_info: { name: "Player" }
  };

  try {
    const auth = pusher.authenticate(socketId, channel, presenceData);
    return res.send(auth);
  } catch (error) {
    console.error("Pusher auth error:", error);
    return res.status(403).send("Forbidden");
  }
};