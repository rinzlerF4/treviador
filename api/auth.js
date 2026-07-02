const Pusher = require("pusher");

const pusher = new Pusher({
  appId: "2172967",
  key: "69bc9629d7ee161329fd",
  secret: "e281db0dd903fbea903c",
  cluster: "eu",
  useTLS: true,
});

module.exports = async (req, res) => {
  try {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const body = req.body || {};
    const socketId = body.socket_id;
    const channel = body.channel_name;

    if (!socketId || !channel) {
      return res.status(400).json({ error: "Missing socket_id or channel_name", received: body });
    }

    const presenceData = {
      user_id: "user-" + Math.random().toString(36).substring(2),
      user_info: { name: "Player" }
    };

    const auth = pusher.authenticate(socketId, channel, presenceData);
    return res.send(auth);
  } catch (err) {
    console.error("Auth Error:", err);
    return res.status(500).json({ 
      error: "Internal Server Error", 
      message: err.message, 
      stack: err.stack 
    });
  }
};
