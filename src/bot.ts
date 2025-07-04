import { Client, GatewayIntentBits, Message } from 'discord.js';
import { config } from 'dotenv';
import { execFile } from 'child_process';
import { writeFileSync, unlinkSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

function runPython(task: Record<string, unknown>): Promise<string> {
  return new Promise((resolve, reject) => {
    const tempPath = join(tmpdir(), `task-${Date.now()}.json`);
    writeFileSync(tempPath, JSON.stringify(task));
    execFile('python3', ['bot_calc.py', tempPath], (err, stdout, stderr) => {
      unlinkSync(tempPath);
      if (err) {
        reject(stderr || err.message);
      } else {
        resolve(stdout.trim());
      }
    });
  });
}

async function handleMessage(message: Message) {
  if (!message.content.startsWith('!mortar')) return;
  const parts = message.content.split(/\s+/);
  if (parts.length < 8) {
    await message.reply('Usage: !mortar <mGrid> <mElev> <mCallsign> <foGrid> <foElev> <azimuth> <distance>');
    return;
  }

  const [command, mGrid, mElev, mCallsign, foGrid, foElev, azimuth, distance] = parts;
  const task = {
    mission_type: 'Regular',
    ammo: 'M821 HE',
    creep_direction: 0,
    fo_grid_str: foGrid,
    fo_elev: Number(foElev),
    fo_azimuth_deg: Number(azimuth),
    fo_dist: Number(distance),
    fo_elev_diff: 0,
    corr_lr: 0,
    corr_ad: 0,
    mortars: [
      { grid: mGrid, elev: Number(mElev), callsign: mCallsign },
    ],
  };

  try {
    const output = await runPython(task);
    await message.reply(`Result: ${output}`);
  } catch (e) {
    await message.reply('Error running calculation.');
  }
}

client.on('messageCreate', handleMessage);
client.on('ready', () => {
  console.log(`Bot online as ${client.user?.tag}`);
});

client.login(process.env.TOKEN);
