const {
  SlashCommandBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("submit")
    .setDescription("Submit a whitelist application"),

  async execute(interaction) {
    const modal = new ModalBuilder()
      .setCustomId("whitelist_submit")
      .setTitle("Whitelist Application");

    const characterName = new TextInputBuilder()
      .setCustomId("character_name")
      .setLabel("Character Name")
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const age = new TextInputBuilder()
      .setCustomId("age")
      .setLabel("Age")
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const vouchedBy = new TextInputBuilder()
      .setCustomId("vouched_by")
      .setLabel("Vouched By (optional)")
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

