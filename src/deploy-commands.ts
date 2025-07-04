import { REST } from '@discordjs/rest';
import { Routes, SlashCommandBuilder } from 'discord.js';
import * as dotenv from 'dotenv';
dotenv.config();

const commands = [
  new SlashCommandBuilder()
    .setName('mortar')
    .setDescription('Calculate a mortar firing solution')
    .addStringOption(o => o
      .setName('mortar_grid')
      .setDescription('Mortar 10-digit grid coordinate')
      .setRequired(true))
    .addNumberOption(o => o
      .setName('mortar_elevation')
      .setDescription('Mortar elevation (meters)')
      .setRequired(true))
    .addStringOption(o => o
      .setName('callsign')
      .setDescription('Mortar callsign')
      .setRequired(true))
    .addStringOption(o => o
      .setName('fo_grid')
      .setDescription('Forward Observer grid')
      .setRequired(true))
    .addNumberOption(o => o
      .setName('fo_elevation')
      .setDescription('Forward Observer elevation (meters)')
      .setRequired(true))
    .addNumberOption(o => o
      .setName('azimuth')
      .setDescription('Azimuth to target (degrees)')
      .setRequired(true))
    .addNumberOption(o => o
      .setName('distance')
      .setDescription('Distance to target (meters)')
      .setRequired(true))
    .toJSON()
];

(async () => {
  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN!);
  console.log('🔄 Registering slash commands...');
  await rest.put(
    Routes.applicationCommands(process.env.CLIENT_ID!),
    { body: commands }
  );
  console.log('✅ Slash commands registered.');
})();
