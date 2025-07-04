import { REST } from '@discordjs/rest';
import { Routes, SlashCommandBuilder } from 'discord.js';

export async function registerCommands(token: string, clientId: string) {
  const commands = [
    new SlashCommandBuilder()
      .setName('mortar')
      .setDescription('Calculate a mortar firing solution from coordinates')
      .addNumberOption(o => o
        .setName('mortar_x')
        .setDescription("Your mortar's X coordinate (e.g., 6061)")
        .setRequired(true))
      .addNumberOption(o => o
        .setName('mortar_y')
        .setDescription("Your mortar's Y coordinate (e.g., 5718)")
        .setRequired(true))
      .addNumberOption(o => o
        .setName('mortar_z')
        .setDescription("Your mortar's elevation (Z) in meters (e.g., 88)")
        .setRequired(true))
      .addNumberOption(o => o
        .setName('target_x')
        .setDescription("Target's X coordinate (e.g., 5537)")
        .setRequired(true))
      .addNumberOption(o => o
        .setName('target_y')
        .setDescription("Target's Y coordinate (e.g., 6093)")
        .setRequired(true))
      .addNumberOption(o => o
        .setName('target_z')
        .setDescription("Target's elevation (Z) in meters (e.g., 96)")
        .setRequired(true))
      .addStringOption(o => o
        .setName('shell_type')
        .setDescription('Choose shell type')
        .setRequired(true)
        .addChoices(
          { name: 'O-832DU (Russian HE)', value: 'O-832DU' },
          { name: 'D-832DU (Russian Smoke)', value: 'D-832DU' },
          { name: 'S-832C (Russian Illumination)', value: 'S-832C' },
          { name: 'M821 HE (NATO HE)', value: 'M821 HE' },
          { name: 'M853A1 Illumination (NATO Illumination)', value: 'M853A1 Illumination' },
          { name: 'M819 Smoke (NATO Smoke)', value: 'M819 Smoke' }
        )
      )
      .toJSON(),
    new SlashCommandBuilder()
      .setName('howto')
      .setDescription('How to get the required coordinates and elevation')
      .toJSON()
  ];

  const rest = new REST({ version: '10' }).setToken(token);
  console.log('🔄 Registering slash commands...');
  await rest.put(
    Routes.applicationCommands(clientId),
    { body: commands }
  );
  console.log('✅ Slash commands registered.');
}
