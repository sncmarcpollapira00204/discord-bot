// Whitelist System
// Project: Poblacion City Roleplay
// 02.01.2026

const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

const config = require("../config.json");

module.exports = async (interaction) => {
  // 
  if (!interaction.isModalSubmit()) return;

  /* ===============================
     WHITELIST SUBMISSION
     =============================== */
  if (interaction.customId === "whitelist_submit") {

    // Application Form
    const characterName = interaction.fields.getTextInputValue("character_name");
    const age = interaction.fields.getTextInputValue("age");
    const steamProfile = interaction.fields.getTextInputValue("steam_profile");

    const vouchedBy = "None";

    // Discord Account Age
    const createdAt = interaction.user.createdAt;
    const now = new Date();

    const diffMs = now - createdAt;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffYears = Math.floor(diffDays / 365);
    const diffMonths = Math.floor((diffDays % 365) / 30);

    const accountAge = `${diffYears}y ${diffMonths}m`;

    // ============================================================================================= // 

    const SPACER = "\u200B";

    // Main - whitelist embed
    const embed = new EmbedBuilder()
      .setTitle("📄 New Whitelist Application")
      .setColor("Orange")
      .addFields(
        { name: "👤 Applicant", value: `${interaction.user}`, inline: true },
        { name: "📌 Account Age", value: accountAge, inline: true },
        { name: SPACER, value: SPACER },
        { name: "👤 Character Name", value: characterName, inline: true },
        { name: "🎂 Age", value: age, inline: true },
        { name: SPACER, value: SPACER },
        { name: "🔗 Steam Profile", value: `[View Profile](${steamProfile})` },
        { name: SPACER, value: SPACER },
        { name: "👥 Vouched By", value: vouchedBy, inline: true },
        { name: "📊 Status", value: "⏳ Pending", inline: true }
      )
      .setThumbnail(
        interaction.user.displayAvatarURL({ dynamic: true, size: 256 })
      )
      .setFooter({ text: "Poblacion City Roleplay" })
      .setTimestamp();

    // Buttons
    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("vouch")
        .setLabel("Vouch")
        .setEmoji("🖐️")
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId("approve")
        .setLabel("Approve")
        .setEmoji("✅")
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId("deny")
        .setLabel("Deny")
        .setEmoji("✖️")
        .setStyle(ButtonStyle.Danger)
    );

    // Response to Whitelist Channel
    const channel = interaction.client.channels.cache.get(
      config.whitelistChannelId
    );

    if (!channel) {
      return interaction.reply({
        content: "❌ Whitelist channel not found.",
        ephemeral: true
      });
    }

    await channel.send({
      embeds: [embed],
      components: [buttons]
    });

    return interaction.reply({
      content: "✅ Your application has been submitted!",
      ephemeral: true
    });
  }

  /* ===============================
     DENY MODAL
     =============================== */
  if (interaction.customId.startsWith("deny_reason_modal:")) {

    const reason = interaction.fields.getTextInputValue("deny_reason");
    const messageId = interaction.customId.split(":")[1];

    const message = await interaction.channel.messages
      .fetch(messageId)
      .catch(() => null);

    if (!message || !message.embeds.length) {
      return interaction.reply({
        content: "❌ Application message not found.",
        ephemeral: true
      });
    }

    const embed = EmbedBuilder.from(message.embeds[0]);

    // Update status field
    const statusField = embed.data.fields.find(
      field => field.name.includes("Status")
    );

    if (!statusField) {
      return interaction.reply({
        content: "❌ Application data corrupted.",
        ephemeral: true
      });
    }

    statusField.value = "❌ Denied";

    embed.addFields(
      { name: "Denied By", value: `${interaction.user}` },
      { name: "Denial Reason", value: reason }
    );

    await message.edit({
      embeds: [embed],
      components: []
    });

   // await message.reply(
   //  `❌ Application denied.\nReason: ${reason}`
   //);

    return interaction.reply({
      content: "❌ Your Whitelist application has been Denied.",
      ephemeral: true
    });
  }
};