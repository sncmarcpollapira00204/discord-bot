const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

const config = require("../config.json");

module.exports = async (interaction) => {
  if (!interaction.isModalSubmit()) return;

/* =======================================================
   WHITELIST SUBMIT MODAL
   ======================================================= */
if (interaction.customId === "whitelist_submit") {

  /* ---------- FORM INPUTS ---------- */
  const characterName =
    interaction.fields.getTextInputValue("character_name");

  const age =
    interaction.fields.getTextInputValue("age");

  const steamProfile =
    interaction.fields.getTextInputValue("steam_profile");

  const vouchedBy = "None";

  /* ---------- ACCOUNT AGE ---------- */
  const createdAt = interaction.user.createdAt;
  const now = new Date();

  const diffMs = now - createdAt;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffYears = Math.floor(diffDays / 365);
  const diffMonths = Math.floor((diffDays % 365) / 30);

  const accountAge = `${diffYears} year(s), ${diffMonths} month(s)`;


/* ---------- EMBED ---------- */
const SPACER = "\u200B";

const embed = new EmbedBuilder()
  .setTitle("📄 New Whitelist Application")
  .setColor("Orange")

  // ───────────── ROW 1 ─────────────
  .addFields(
    {
      name: "👤 Applicant",
      value: `${interaction.user}`,
      inline: true
    },
    {
      name: "📌 Account Age",
      value: accountAge,
      inline: true
    }
  )

  // Spacer
  .addFields({ name: SPACER, value: SPACER })

  // ───────────── ROW 2 ─────────────
  .addFields(
    {
      name: "👤 Character Name",
      value: characterName,
      inline: true
    },
    {
      name: "🎂 Age",
      value: age,
      inline: true
    }
  )

  // Spacer
  .addFields({ name: SPACER, value: SPACER })

  // ───────────── STEAM PROFILE (FULL WIDTH) ─────────────
  .addFields({
    name: "🔗 Steam Profile",
    value: `[View Profile](${steamProfile})`,
    inline: false
  })

  // Spacer
  .addFields({ name: SPACER, value: SPACER })

  // ───────────── ROW 3 ─────────────
  .addFields(
    {
      name: "👥 Vouched By",
      value: vouchedBy,
      inline: true
    },
    {
      name: "📊 Status",
      value: "⏳ Pending",
      inline: true
    }
  )

  // Bottom spacing
  .addFields({ name: SPACER, value: SPACER })

  // Right-side avatar
  .setThumbnail(
    interaction.user.displayAvatarURL({
      dynamic: true,
      size: 256
    })
  )

  // Footer + time
  .setFooter({ text: "Poblacion City Roleplay" })
  .setTimestamp();

    /* ---------- BUTTONS ---------- */
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
        flags: 64
      });
    }

    await channel.send({
      embeds: [embed],
      components: [buttons]
    });

    return interaction.reply({
      content: "✅ Your application has been submitted!",
      flags: 64
    });
  }

  /* =======================================================
     DENY MODAL (PLAIN TEXT – NO DMs)
     ======================================================= */
  if (interaction.customId.startsWith("deny_reason_modal:")) {

    const reason = interaction.fields.getTextInputValue("deny_reason");
    const messageId = interaction.customId.split(":")[1];

    const channel = interaction.channel;
    const message = await channel.messages.fetch(messageId).catch(() => null);

    if (!message || !message.embeds.length) {
      return interaction.reply({
        content: "❌ Application message not found.",
        flags: 64
      });
    }

    const embed = EmbedBuilder.from(message.embeds[0]);

    const statusField = embed.data.fields.find(
      f => f.name.includes("Status")
    );

    if (!statusField) {
      return interaction.reply({
        content: "❌ Application data corrupted.",
        flags: 64
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

    await message.reply(
      `❌ Application denied.\nReason: ${reason}`
    );

    return interaction.reply({
      content: "❌ Application denied.",
      flags: 64
    });
  }
};
