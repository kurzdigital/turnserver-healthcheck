import express from "express";
import {logger} from "./logging";
import {isTurnServerAvailable} from "./turnserver-check";

const app = express();
const port = process.env.SERVER_PORT || 3000;

const whitelist = process.env.TURNSERVER_WHITELIST;

app.get('/', async (req, res) => {
  const url = req.query.url as string | null;
  const username = req.query.username as string | null;
  const credential = req.query.credential as string | null;
  const format = req.query.format as string | null || 'json';

  if (format !== 'json' && format !== 'flag' && format !== 'http-status') {
    return sendJSONResponse(res, 400, {
      error: `Invalid format. Use 'json', 'flag', or 'http-status'`
    });
  }

  if (!url) {
    return sendJSONResponse(res, 400, {
      error: 'No url provided'
    });
  }

  if (whitelist) {
    const allowedUrls = whitelist.split(';');
    if (allowedUrls.indexOf(url) === -1) {
      logger.debug('Blocked health-check for non-whitelisted url', {url, username, credential});
      return sendJSONResponse(res, 403, {
        error: 'The provided url is not whitelisted'
      });
    }
  }

  logger.log('debug', `Performing health-check`, {url, username, credential});

  const turnServerAvailable = await isTurnServerAvailable({
    urls: url,
    credential,
    username
  });

  logger.log('debug', `Successfully performed health-check`, {url, username, credential, turnServerAvailable});

  // Respond in the requested format
  switch (format) {
    case 'flag':
      return res.send(turnServerAvailable ? '1' : '0');
    case 'json':
      return sendJSONResponse(res, 200, {
        available: turnServerAvailable
      });
    case 'http-status':
      return res.sendStatus(turnServerAvailable ? 200 : 418);
    default:
      throw Error('Unknown format!');
  }
});

// Start server
app.listen(port, () => logger.log('info', `Server started at port ${port}`));

function sendJSONResponse(res: any, status: number, json: any) {
  res.statusCode = status;
  res.send(JSON.stringify(json));
}