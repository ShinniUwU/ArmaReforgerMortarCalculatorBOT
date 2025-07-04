import { Client, GatewayIntentBits, Events, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { config } from 'dotenv';
import { execFile } from 'child_process';
import { writeFileSync, unlinkSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { registerCommands } from './registerCommands';

config();

const client = new Client({
  intents: [ GatewayIntentBits.Guilds ]
});

function runPython(task: Record<string, unknown>): Promise<string> {
  return new Promise((resolve, reject) => {
    const tmp = join(tmpdir(), `task-${Date.now()}.json`);
    writeFileSync(tmp, JSON.stringify(task));
    execFile('python3', ['../backend/bot_calc.py', tmp], (err, stdout, stderr) => {
      unlinkSync(tmp);
      if (err) {
        console.error('Python backend error:', stderr || err.message);
        reject(stderr || err.message);
      } else {
        resolve(stdout.trim());
      }
    });
  });
}

function calculateAzimuthAndDistance(yourGrid: string, targetGrid: string) {
  // Dummy implementation: replace with your real grid parsing and math!
  // Returns { azimuth: number, distance: number }
  return { azimuth: 0, distance: 0 };
}

function calculateFromCoords(mx: number, my: number, mz: number, tx: number, ty: number, tz: number) {
  const dx = tx - mx;
  const dy = ty - my;
  const dz = tz - mz;
  const distance = Math.sqrt(dx*dx + dy*dy);
  const azimuth = (Math.atan2(dx, dy) * 180 / Math.PI + 360) % 360;
  const elev_diff = dz;
  return { distance, azimuth, elev_diff };
}

client.once(Events.ClientReady, () => {
  console.log(`🤖 Bot online as ${client.user?.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  // HOWTO COMMAND
  if (interaction.commandName === 'howto') {
    const embed = new EmbedBuilder()
      .setTitle('🗺️ How to get coordinates and elevation')
      .setDescription('**How to get each value for the /mortar command:**')
      .addFields(
        { name: 'X/Y/Z coordinates', value: 'Open your map, hover over your mortar or target, and read the coordinates (e.g., x:6061 y:5718 z:88).' },
        { name: 'Elevation (Z)', value: 'This is the third number in the coordinates, or check your GPS/altimeter.' },
        { name: 'Shell type', value: 'Choose from: O-832DU (Russian HE), D-832DU (Russian Smoke), S-832C (Russian Illumination), M821 HE (NATO HE), M853A1 Illumination (NATO Illumination), or M819 Smoke (NATO Smoke).' }
      )
      .setFooter({ text: 'Tip: You only need to enter coordinates and elevation. The bot will do the rest!' });

    await interaction.reply({ embeds: [embed], flags: 4096 });
    return;
  }

  // MORTAR COMMAND
  if (interaction.commandName === 'mortar') {
    const mx = interaction.options.getNumber('mortar_x', true);
    const my = interaction.options.getNumber('mortar_y', true);
    const mz = interaction.options.getNumber('mortar_z', true);
    const tx = interaction.options.getNumber('target_x', true);
    const ty = interaction.options.getNumber('target_y', true);
    const tz = interaction.options.getNumber('target_z', true);
    const shellType = interaction.options.getString('shell_type', true);

    // Map shell types to mortar models and backend shell names
    const shellMappings = {
      'O-832DU': { mortar: '2B14', shell: 'HE O-832DU' },
      'D-832DU': { mortar: '2B14', shell: 'Smoke D-832DU' },
      'S-832C': { mortar: '2B14', shell: 'Illum S-832C' },
      'M821 HE': { mortar: 'M252', shell: 'HE M821' },
      'M853A1 Illumination': { mortar: 'M252', shell: 'Illum M853A1' },
      'M819 Smoke': { mortar: 'M252', shell: 'Smoke M819' }
    };

    const mapping = shellMappings[shellType as keyof typeof shellMappings] || { mortar: 'M252', shell: shellType };
    const mortarModel = mapping.mortar;
    const shell = mapping.shell;
    const ring = 2;

    const { distance, azimuth, elev_diff } = calculateFromCoords(mx, my, mz, tx, ty, tz);

    const task = {
      mission_type: 'Regular',
      mortar_model: mortarModel,
      shell_type: shell,
      ring: ring,
      creep_direction: 0,
      fo_grid_str: '', // Not needed, but backend expects it
      fo_elev: mz,
      fo_azimuth_deg: azimuth,
      fo_dist: distance,
      fo_elev_diff: elev_diff,
      corr_lr: 0,
      corr_ad: 0,
      mortars: [
        {
          coords: [mx, my, mz],
          elev: mz,
          callsign: shell
        }
      ],
      target_coords: [tx, ty, tz]
    };

  try {
    const result = await runPython(task);
      const parsed = JSON.parse(result);

      if (parsed.error === 'out_of_range' || parsed.quick_bar?.includes('Out of range')) {
        await interaction.reply({
          content: '❌ No valid firing solution: Target is out of range for this shell.',
          flags: 4096
        });
        return;
      }

      const embed = new EmbedBuilder()
        .setTitle('🎯 Firing Solution')
        .setDescription(parsed.quick_bar)
        .addFields({ name: 'Details', value: '```' + parsed.details + '```' });
    await interaction.reply({
        embeds: [embed],
      flags: 4096
    });
    } catch (e) {
      console.error('Bot error:', e);
    await (interaction as ChatInputCommandInteraction).reply({
        content: '❌ Error calculating firing solution. (Check bot logs for details.)',
        flags: 4096
    });
    }
    return;
  }
});

(async () => {
  await registerCommands(process.env.DISCORD_TOKEN!, process.env.CLIENT_ID!);
client.login(process.env.DISCORD_TOKEN);
})();
