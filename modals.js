const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

const config = require("../config.json");

module.exports = async (interaction) => {
  if (!interaction.isModalSubmit()) return;

// ========================================================================//

if (interaction.customId === "whitelist_submit") {

  /* ---------- FORM INPUTS ---------- */
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

  const accountAge = `${diffYears} year(s), ${diffMonths} month(s)`;

// Response Embed
const SPACER = "\u200B";

const embed = new EmbedBuilder()
  .setColor(0xff8c00) // COLOR ITO G
  .setAuthor({
    name: "New Whitelist Application",
    iconURL: interaction.guild.iconURL({ dynamic: true })
  })
  .setThumbnail(
    interaction.user.displayAvatarURL({ dynamic: true, size: 256 })
  )

  // Applicant Section
  .addFields({
    name: "👤 APPLICANT INFORMATION",
    value:
      `**User:** ${interaction.user}\n` +
      `**Account Age:** ${accountAge}`,
    inline: false
  })

  // Character Section
  .addFields({
    name: "🎭 CHARACTER DETAILS",
    value:
      `**Character Name:** ${characterName}\n` +
      `**Character Age:** ${age}`,
    inline: false
  })

  // Links Section
  .addFields({
    name: "🔗 LINKS",
    value: `🌐 [Steam Profile](${steamProfile})`,
    inline: false
  })

  // Status Section
  .addFields(
    {
      name: "👥 VOUCHED BY",
      value: "None",
      inline: true
    },
    {
      name: "📊 STATUS",
      value: "🟡 **PENDING REVIEW**",
      inline: true
    }
  )

  .setFooter({
    text: "Poblacion City Roleplay • Whitelist System"
  })
  .setTimestamp();

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

// Denied Modals
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

  const statusField = embed.data.fields.find(
    f => f.name.includes("Status")
  );

  if (!statusField) {
    return interaction.reply({
      content: "❌ Application data corrupted.",
      ephemeral: true
    });
  }

  statusField.value = "🔴 Denied";

  embed.addFields(
    { name: "Denied By", value: `${interaction.user}` },
    { name: "Denial Reason", value: reason }
  );

  await message.edit({
    embeds: [embed],
    components: []
  });

  await message.reply(
    `❌ Application denied.\nReason: ${reason}`
  );

  return interaction.reply({
    content: "❌ Application denied.",
    ephemeral: true
  });
}
};