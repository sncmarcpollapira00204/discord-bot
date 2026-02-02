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
const DIVIDER = "━━━━━━━━━━━━━━━━━━━━━━";
const SPACE = "\u200B";

const embed = new EmbedBuilder()
  .setColor(0xff8c00)
  .setAuthor({
    name: "New Whitelist Application",
    iconURL: interaction.guild.iconURL({ dynamic: true })
  })
  .setThumbnail(
    interaction.user.displayAvatarURL({ dynamic: true, size: 256 })
  )

  .addFields(
    { name: DIVIDER, value: "👤 **APPLICANT INFORMATION**" },
    {
      name: SPACE,
      value:
        `**User:** ${interaction.user}\n` +
        `**Account Age:** ${accountAge}`
    },

    { name: DIVIDER, value: "🎭 **CHARACTER DETAILS**" },
    {
      name: SPACE,
      value:
        `**Character Name:** ${characterName}\n` +
        `**Character Age:** ${age}`
    },

    { name: DIVIDER, value: "🔗 **LINKS**" },
    {
      name: SPACE,
      value: `🌐 [Steam Profile](${steamProfile})`
    },

    { name: DIVIDER, value: "📊 **STATUS**" },
    {
      name: SPACE,
      value: "🟡 **PENDING REVIEW**"
    },

    {
      name: "👥 **VOUCHED BY**",
      value: "None",
      inline: false
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

// ================= DENY MODAL SUBMIT =================
if (interaction.customId.startsWith("deny_reason_modal:")) {

  const reason = interaction.fields.getTextInputValue("deny_reason");
  const messageId = interaction.customId.split(":")[1];

  const message = await interaction.channel.messages
    .fetch(messageId)
    .catch(() => null);

  if (!message || !message.embeds.length) {
    return interaction.reply({
      content: "❌ Application message not found.",
      flags: 64
    });
  }

  const embed = EmbedBuilder.from(message.embeds[0]);
  const fields = embed.data.fields;

  // 🔑 FIND STATUS BY VALUE (NEW EMBED STYLE)
  const statusField = fields.find(f =>
    f.value?.includes("PENDING") ||
    f.value?.includes("APPROVED")
  );

  if (!statusField) {
    return interaction.reply({
      content: "❌ Application data corrupted.",
      flags: 64
    });
  }

  // Update status
  statusField.value = "❌ **DENIED**";

  embed.addFields(
    {
      name: "❌ **DENIED BY**",
      value: `${interaction.user}`
    },
    {
      name: "📄 **DENIAL REASON**",
      value: reason
    }
  );

  await message.edit({
    embeds: [embed],
    components: []
  });

  return interaction.reply({
    content: "❌ Application denied.",
    flags: 64
  });
}
};