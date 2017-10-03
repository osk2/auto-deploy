module.exports = {
  app: {
    port: 8080
  },
  webhook: {
    path: '/webhook',
    secret: 'secret'
  },
  project: {
    url: 'git@github.com:osk2/auto-deploy.git',
    path: './',
  }
}