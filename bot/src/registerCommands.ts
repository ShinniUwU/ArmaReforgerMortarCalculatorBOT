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
        .setDescription('Choose shell type: Russian (OF-832DU) or NATO (M821 HE)')
        .setRequired(true)
        .addChoices(
          { name: 'Russian (OF-832DU)', value: 'OF-832DU' },
          { name: 'NATO (M821 HE)', value: 'M821 HE' }
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
