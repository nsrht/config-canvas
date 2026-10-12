export const exampleFiles = [
  {
    name: 'package.json (Simple)',
    content: `{
  "name": "config-canvas",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "start": "node index.js"
  }
}`
  },
  {
    name: 'config.json (Complex)',
    content: `{
  "server": {
    "port": 8080,
    "host": "localhost",
    "enableSsl": false,
    "credentials": null
  },
  "database": {
    "type": "postgres",
    "url": "postgres://user:pass@localhost/db",
    "poolSize": 10
  },
  "features": [
    "auth",
    "logging",
    "metrics"
  ],
  "metricsConfig": {
    "interval": 60,
    "tags": ["prod", "v1"]
  },
  "unsafeNumbers": {
    "maxId": 9007199254740995,
    "longFloat": 1.234567890123456789
  }
}`
  },
  {
    name: 'empty.json (Empty)',
    content: `{}`
  }
];
