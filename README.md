# lemmmy-post-bot #

Posts a daily discussion thread using the lemmy API.

## Setup ##

1. Run `npm install`
2. Run `npm run build`
3. In build/src create a settings.json file

Your settings.json file should have this content:

```json
{
  "botUser": "bot user name",
  "botPassword": "bot password",
  "communityId": 3, // must be an int
  "baseURL": "base URL with trailing slash"
}
```

## Use ##

To run the bot: `node build/src/index.js`

## Nightly Run

Cron setup instructions are [here](doc/SETUP_CRON.md)