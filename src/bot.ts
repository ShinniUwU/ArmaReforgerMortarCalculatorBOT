import { Client, GatewayIntentBits, Events, ChatInputCommandInteraction } from 'discord.js';
import { config } from 'dotenv';
import { execFile } from 'child_process';
import { writeFileSync, unlinkSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

config();

const client = new Client({
  intents: [ GatewayIntentBits.Guilds ]
});

function runPython(task: Record<string, unknown>): Promise<string> {
  return new Promise((resolve, reject) => {
    const tmp = join(tmpdir(), `task-${Date.now()}.json`);
    writeFileSync(tmp, JSON.stringify(task));
    execFile('python3', ['bot_calc.py', tmp], (err, stdout, stderr) => {
      unlinkSync(tmp);
      if (err) reject(stderr || err.message);
      else resolve(stdout.trim());
    });
  });
}

client.once(Events.ClientReady, () => {
  console.log(`🤖 Bot online as ${client.user?.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand() || interaction.commandName !== 'mortar') return;

  const task = {
    mission_type: 'Regular',
    ammo: 'M821 HE',
    creep_direction: 0,
    fo_grid_str: interaction.options.getString('fo_grid', true),
    fo_elev: interaction.options.getNumber('fo_elevation', true),
    fo_azimuth_deg: interaction.options.getNumber('azimuth', true),
    fo_dist: interaction.options.getNumber('distance', true),
    fo_elev_diff: 0,
    corr_lr: 0,
    corr_ad: 0,
    mortars: [
      {
        grid: interaction.options.getString('mortar_grid', true),
        elev: interaction.options.getNumber('mortar_elevation', true),
        callsign: interaction.options.getString('callsign', true)
      }
    ]
  };

  try {
    const result = await runPython(task);
    await interaction.reply({
      content: `🎯 **Firing Solution**\n\`\`\`\n${result}\n\`\`\``,
      ephemeral: true
    });
  } catch {
    await (interaction as ChatInputCommandInteraction).reply({
      content: '❌ Error calculating firing solution.',
      ephemeral: true
    });
  }
});

client.login(process.env.DISCORD_TOKEN);
