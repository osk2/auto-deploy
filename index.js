const express = require('express');
const shell = require('shelljs');
const createHandler = require('github-webhook-handler');
const _ = require('lodash');
const low = require('lowdb')
const FileAsync = require('lowdb/adapters/FileAsync');
const app = express();
const adapter = new FileAsync('./db.json');

low(adapter)
.then((db) => {
  const handler = createHandler({
    path: db.get('config.webhook.path').value(),
    secret: db.get('config.webhook.secret').value()
  });

  handler.on('push', (event) => {
    const fullname = event.payload.repository.full_name;
    const user = fullname.split('/')[0];
    const repo = fullname.split('/')[1];
    const gitUrl = event.payload.repository.git_url;
    const repoQuery = db.get(`clients.${user}`).find({ repo });
    const isUserExisted = db.get(`clients.${user}`).value();
    const isRepoExisted = repoQuery.value();

    if (isUserExisted) {
      if (isRepoExisted) {
        shell.rm('-rf', `clients/${fullname}`);
        shell.exec(`git clone ${gitUrl} clients/${user}/${repo}`);
        shell.rm('-rf', `clients/${user}/${repo}/.git`);
        repoQuery.assign({
          updated: (new Date()).toString()
        }).write();
      } else {
        shell.exec(`git clone ${gitUrl} clients/${user}/${repo}`);
        shell.rm('-rf', `clients/${user}/${repo}/.git`);
        db.get(`clients.${user}`).push({
          repo: repo,
          url: gitUrl,
          updated: (new Date()).toString()
        }).write();
      }
    } else {
      shell.mkdir(`clients/${user}`);
      shell.exec(`git clone ${gitUrl} clients/${user}/${repo}`);
      shell.rm('-rf', `clients/${user}/${repo}/.git`);
      db.set(`clients.${user}`, []).write();
      db.get(`clients.${user}`).push({
        repo: repo,
        url: gitUrl,
        updated: (new Date()).toString()
      }).write();
    }
  });

  handler.on('ping', (event) => {
    console.log(`ping from "${event.payload.repository.full_name}"`);
  });

  app.use(express.static('clients'));

  app.use((req, res) => {
    handler(req, res, (err) => {
      res.statusCode = 404;
      res.end('Not Found');
    });
  });

  app.listen(db.get('config.port').value(), () => {
    console.log(`App listening on port ${db.get('config.port').value()}`);
  });
})
.catch((ex) => {
  console.log(ex)
});
