const Pusher = require("pusher");

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER || "eu",
  useTLS: true,
});

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const socketId = req.body.socket_id;
  const channel = req.body.channel_name;

  if (!socketId || !channel) {
    console.error("Missing params", { socketId, channel });
    return res.status(400).send("Missing socket_id or channel_name");
  }

  const presenceData = {
    user_id: "user-" + Math.random().toString(36).slice(2),
    user_info: { name: "Player" },
  };

  try {
    const auth = pusher.authenticate(socketId, channel, presenceData);
    return res.send(auth);
  } catch (error) {
    console.error("Pusher auth error:", error);
    return res.status(403).send("Forbidden");
  }
};