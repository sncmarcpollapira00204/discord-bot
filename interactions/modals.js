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

    const characterName =
      interaction.fields.getTextInputValue("character_name");
    const age =
      interaction.fields.getTextInputValue("age");
    const vouchedBy =
      interaction.fields.getTextInputValue("vouched_by") || "None";

    const embed = new EmbedBuilder()
      .setTitle("📄 Poblacion Application")
      .setColor("Orange")
      .addFields(
        { name: "Applicant", value: `${interaction.user}`, inline: true },
        { name: "Character Name", value: characterName, inline: true },
        { name: "Age", value: age, inline: true },
        { name: "Vouched By", value: vouchedBy, inline: false },
        { name: "Status", value: "⏳ Pending", inline: false }
      )
      .setTimestamp();

    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("vouch")
        .setLabel("Vouch")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("approve")
        .setLabel("Approve")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId("deny")
        .setLabel("Deny")
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

  /* =======================================================
     DENY MODAL (NO DMs – REPLY TO APPLICATION)
     ======================================================= */
  if (interaction.customId.startsWith("deny_reason_modal:")) {

  const reason = interaction.fields.getTextInputValue("deny_reason");

  const messageId = interaction.customId.split(":")[1];
  const channel = interaction.channel;

  const message = await channel.messages.fetch(messageId);
  const embed = EmbedBuilder.from(message.embeds[0]);

  // Update status
  const statusIndex = embed.data.fields.findIndex(
    f => f.name === "Status"
  );
  embed.data.fields[statusIndex].value = "❌ Denied";

  // Add denial reason to embed
  embed.addFields({
    name: "Denial Reason",
    value: reason
  });

  // Edit the original application embed
  await message.edit({
    embeds: [embed],
    components: []
  });

  // ✅ PLAIN TEXT REPLY ONLY (NO EMBED)
  await message.reply(
    `❌ Application denied.\nReason: ${reason}`
  );

  return interaction.reply({
    content: "❌ Application denied.",
    ephemeral: true
  });
}
};