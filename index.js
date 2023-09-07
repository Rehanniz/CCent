const express = require('express');
const axios = require('axios'); // Axios is used to make HTTP requests
const app = express();
const port = 3000;

const discordWebhookUrl = 'YOUR_DISCORD_WEBHOOK_URL'; // Replace with your Discord webhook URL

app.use(express.json());

app.use((req, res, next) => {
  const logMessage = `Received ${req.method} request at ${req.url} from IP ${req.ip}`;
  console.log(logMessage);

  // Send log message to Discord
  axios.post(discordWebhookUrl, {
    content: logMessage,
  })
    .then(() => {
      console.log('Log sent to Discord successfully');
    })
    .catch((error) => {
      console.error('Error sending log to Discord:', error);
    });

  next();
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
