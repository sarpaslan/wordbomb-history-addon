# Word History

A simple example Word Bomb addon that tracks your last 100 words and prompts, with Discord export.

## Features

- Track your last 100 word submissions
- View recent history with `/history`
- Export full history to Discord DM with `/export`
- Clear your history with `/clearhistory`

## Setup

1. Clone the repository
```bash
git clone https://github.com/sarpaslan/wordbomb-word-history
cd wordbomb-word-history
```

2. Install dependencies
```bash
npm install
```

3. Get your addon token
   - Open Word Bomb (https://wordbomb.io)
   - Press **F2** to open the console
   - Type `token` and press Enter
   - Copy your token

4. Create `.env` file
```bash
cp .env.example .env
```

5. Add your token to `.env`
```
ADDON_TOKEN=your_token_here
```

6. Run the addon
```bash
npm start
```

## Commands

| Command | Description |
|---------|-------------|
| `/history` | View your last 10 words |
| `/export` | Send full history to Discord DM |
| `/clearhistory` | Clear your history |

## Permissions

This addon uses the `io.wordbomb.sendmessage` permission to send Discord DMs for the export feature. Players will be asked to grant this permission when enabling the addon.

## See Also

- [Word Bomb Addon SDK](https://github.com/sarpaslan/wordbomb-addon) - Create your own addons

## License

MIT
