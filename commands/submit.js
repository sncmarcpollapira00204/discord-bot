const {
  SlashCommandBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('submit')
    .setDescription('Submit a FiveM whitelist application'),

  async execute(interaction) {
    const modal = new ModalBuilder()
      .setCustomId('whitelistSubmit')
      .setTitle('FiveM Whitelist Application');

    const characterName = new TextInputBuilder()
      .setCustomId('characterName')
      .setLabel('Character Name')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const age = new TextInputBuilder()
      .setCustomId('age')
      .setLabel('Age')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const vouchedBy = new TextInputBuilder()
      .setCustomId('vouchedBy')
      .setLabel('Vouched by (optional)')
      .setStyle(TextInputStyle.Short)
      .setRequired(false);

    modal.addComponents(
      new ActionRowBuilder().addComponents(characterName),
      new ActionRowBuilder().addComponents(age),
      new ActionRowBuilder().addComponents(vouchedBy)
    );

    await interaction.showModal(modal);
  }
};
