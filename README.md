# デプロイ

```bash
dotenv kamal deploy
```

# ts実行

```bash
node --import tsx --env-file .env --watch ./src/scripts/discord.ts
```

# API実行

```bash
jo 'url=https://www.youtube.com/watch?v=0WvnNCBCHPI'| curl -XPOST 'http://localhost:3000/api/youtube/' -H "Content-Type: application/json" -d @-
```
