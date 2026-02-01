const {
  SlashCommandBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder
} = require("discord.js");

const config = require("../config.json");

/* ===============================
   COOLDOWN SETUP
   =============================== */
const cooldowns = new Map();
const COOLDOWN_TIME = 10 * 60 * 1000; // 10 minutes

module.exports = {
  data: new SlashCommandBuilder()
    .setName("submit")
    .setDescription("Submit a whitelist application"),

  async execute(interaction) {

    /* ===============================
       BLOCK CITIZENS FROM APPLYING
       =============================== */
    if (interaction.member.roles.cache.has(config.citizenRoleId)) {
      return interaction.reply({
        content: "❌ You are already a **Citizen** and cannot submit another application.",
        flags: 64
      });
    }

    const userId = interaction.user.id;
    const now = Date.now();

    /* ===============================
       COOLDOWN CHECK
       =============================== */
    if (cooldowns.has(userId)) {
      const lastUsed = cooldowns.get(userId);
      const remaining = COOLDOWN_TIME - (now - lastUsed);

      if (remaining > 0) {
        const minutes = Math.ceil(remaining / 60000);
        return interaction.reply({
          content: `⏳ Please wait **${minutes} minute(s)** before submitting again.`,
          flags: 64
        });
      }
    }

    cooldowns.set(userId, now);

    /* ===============================
       MODAL
       =============================== */
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

    const steamProfile = new TextInputBuilder()
      .setCustomId("steam_profile")
      .setLabel("Steam Profile URL")
      .setPlaceholder("https://steamcommunity.com/id/yourname")
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(characterName),
      new ActionRowBuilder().addComponents(age),
      new ActionRowBuilder().addComponents(steamProfile)
    );

    await interaction.showModal(modal);
  }
};