const Pusher = require("pusher");

const pusher = new Pusher({
  appId: "2172967",
  key: "69bc9629d7ee161329fd",
  secret: "e281db0dd903fbea903c",
  cluster: "eu",
  useTLS: true,
});

module.exports = async (req, res) => {
  const socketId = req.body.socket_id;
  const channel = req.body.channel_name;
  const auth = pusher.authenticate(socketId, channel);
  res.send(auth);
};