const http = require('http');
const shell = require('shelljs');
const createHandler = require('github-webhook-handler');
const config = require('./config');
const handler = createHandler({
  path: config.webhook.path,
  secret: config.webhook.secret
});

http.createServer((req, res) => {
  handler(req, res, (err) => {
    res.statusCode = 404;
    res.end('No Found');
  });
}).listen(config.app.port);

console.log(`App listening on port ${config.app.port}`);

handler.on('push', (event) => {
  shell.rm('-r', config.project.path);
  shell.exec(`git clone ${config.project.url}`);
});

handler.on('ping', (event) => {
  console.log('pong');
});
