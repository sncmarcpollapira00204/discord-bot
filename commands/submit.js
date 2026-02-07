/* PROJECT POBLACION - DISCORD BOT */

/*========================================================
  DISCORD WHITELISTING SYSTEM
  ========================================================*/

  /* AFTER SUBMIT CONFIGURATION */

const {
  SlashCommandBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder
} = require("discord.js");

const config = require("../config.json");

const cooldowns = new Map();
const COOLDOWN_TIME = 10 * 60 * 1000; // 10 minutes

module.exports = {
  data: new SlashCommandBuilder()
    .setName("submit")
    .setDescription("Submit a whitelist application"),

  async execute(interaction) {
    const userId = interaction.user.id;
    const now = Date.now();

    // Block citizens
    if (interaction.member.roles.cache.has(config.citizenRoleId)) {
      return interaction.reply({
        content: "❌ You are already a **Citizen**.",
        ephemeral: true
      });
    }

    // Cooldown
    const lastUsed = cooldowns.get(userId);
    if (lastUsed && now - lastUsed < COOLDOWN_TIME) {
      const mins = Math.ceil(
        (COOLDOWN_TIME - (now - lastUsed)) / 60000
      );
      return interaction.reply({
        content: `⏳ Please wait **${mins} minute(s)**.`,
        ephemeral: true
      });
    }

    cooldowns.set(userId, now);

    // Modal
    const modal = new ModalBuilder()
      .setCustomId("whitelist_submit")
      .setTitle("📄 Whitelist Application");

    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("character_name")
          .setLabel("Character Name")
          .setPlaceholder("Firstname Lastname")
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("age")
          .setLabel("Character Age")
          .setPlaceholder("18+")
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("steam_profile")
          .setLabel("Steam Profile URL")
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
      )
    );

    await interaction.showModal(modal);
  }
};