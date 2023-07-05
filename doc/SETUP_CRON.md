# Cron Setup #

This allows you to call the bot nightly.

Create a wrapper script to call the bot, for example create bot-daily.sh containing:

```bash
#!/bin/bash
node /home/user/lemmy-postbot/dist/lemmy-post-bot.js
```

Set permissions

```bash
chmod bot-daily.sh
```

Add an entry to crontab:

```bash
crontab -e
```

Crontab:

```bash
5 0 * * * /home/user/bot-daily.sh >> /home/user/bot-daily.log 2>&1
```

This will execute the bot every night at 12:05am, and log to bot-daily.log