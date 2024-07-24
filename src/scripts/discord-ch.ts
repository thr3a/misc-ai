import { Client, GatewayIntentBits } from 'discord.js';

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('ready', async () => {
  console.log(`Logged in as ${client.user?.tag}!`);

  const guildId = process.env.DISCORD_GUILD_ID; // ここに対象サーバーのIDを入力
  const guild = await client.guilds.fetch(guildId || '');

  if (!guild) {
    console.log(`Guild with ID ${guildId} not found!`);
    return;
  }

  const channels = await guild.channels.fetch();

  for (const channel of channels.values()) {
    if (channel) {
      console.log(`Name: ${channel.name}, ID: ${channel.id}`);
    }
  }
  console.log('Ctrl+Cで終了');
  // client.destroy(); // すぐに終了したくない場合はコメントアウトしてください
});

client.login(process.env.DISCORD_BOT_TOKEN);
