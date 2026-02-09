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

/* COOLDOWN CONFIGURATION */

const cooldowns = new Map();
const COOLDOWN_TIME = 1 * 60 * 1000; // 1 MINUTE(S) COOLDOWN

/* COMMANDS */

module.exports = {
  data: new SlashCommandBuilder()
    .setName("submit")
    .setDescription("Submit a whitelist application"),

  async execute(interaction) {
    try {
      const userId = interaction.user.id;
      const now = Date.now();

      /* CITIZEN ROLE = BLOCKED */
      
      if (interaction.member?.roles.cache.has(config.citizenRoleId)) {
        return interaction.reply({
          content: "❌ You are already a **CITIZEN** and cannot submit another application.",
          flags: 64 // Ephemeral
        });
      }

      /* COOLDOWN CONFIGURATION 2 */
      
      const lastUsed = cooldowns.get(userId);

      if (lastUsed) {
        const remaining = COOLDOWN_TIME - (now - lastUsed);

        if (remaining > 0) {
          const minutes = Math.ceil(remaining / 60000);
          return interaction.reply({
            content: `⏳ Please wait **${minutes} minute(s)** before submitting again.`,
            flags: 64
          });
        }
      }

      // COMMAND COOLDOWN SET
      cooldowns.set(userId, now);

      //////* WHITELIST APPLICATION FORM *//////

      const modal = new ModalBuilder()
        .setCustomId("whitelist_submit")
        .setTitle("📄 Whitelist Application");

      const characterName = new TextInputBuilder()
        .setCustomId("character_name")
        .setLabel("Character Name")
        .setPlaceholder("Firstname Lastname")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const age = new TextInputBuilder()
        .setCustomId("age")
        .setLabel("Character Age")
        .setPlaceholder("18+")
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

      /* SUBMIT ERRORS */

      await interaction.showModal(modal);

    } catch (error) {
      console.error("❌ /submit error:", error);

      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: "❌ Something went wrong. Please try again.",
          flags: 64
        });
      }
    }
  }
};