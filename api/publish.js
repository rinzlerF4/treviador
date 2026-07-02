const Pusher = require("pusher");

const pusher = new Pusher({
  appId: "2172967",
  key: "69bc9629d7ee161329fd",
  secret: "e281db0dd903fbea903c",
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

  const { channel, event, data } = body || {};

  if (!channel || !event) {
    return res.status(400).send('Missing params');
  }
  if (!channel.startsWith('triviador-public-')) {
    return res.status(400).send('Invalid channel');
  }

  try {
    await pusher.trigger(channel, event, data);
    return res.status(200).send('ok');
  } catch (error) {
    console.error('Pusher publish error:', error);
    return res.status(500).send('Publish failed');
  }
};