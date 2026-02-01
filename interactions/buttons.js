const { EmbedBuilder } = require("discord.js");
const config = require("../config.json");

module.exports = async (interaction) => {
  if (!interaction.isButton()) return;

  const message = interaction.message;
  const embed = EmbedBuilder.from(message.embeds[0]);

  /* ---------- VOUCH ---------- */
  if (interaction.customId === "vouch") {

    // Citizen role check
    if (!interaction.member.roles.cache.has(config.citizenRoleId)) {
      return interaction.reply({
        content: "❌ Depungol ka wala kang Citizen",
        ephemeral: true
      });
    }

    const fieldIndex = embed.data.fields.findIndex(
      f => f.name === "Vouched By"
    );

    let currentVouches = embed.data.fields[fieldIndex].value;
    const voucher = interaction.user.toString();

    if (currentVouches.includes(voucher)) {
      return interaction.reply({
        content: "❌ You already vouched.",
        ephemeral: true
      });
    }

    currentVouches =
      currentVouches === "None"
        ? voucher
        : `${currentVouches}, ${voucher}`;

    embed.data.fields[fieldIndex].value = currentVouches;

    await message.edit({ embeds: [embed] });

    return interaction.reply({
      content: "✅ Vouched successfully.",
      ephemeral: true
    });
  }

  /* ---------- APPROVE ---------- */
  if (interaction.customId === "approve") {

    // Admin role check
    if (!interaction.member.roles.cache.has(config.adminRoleId)) {
      return interaction.reply({
        content: "❌ You do not have permission to approve.",
        ephemeral: true
      });
    }

    // Update status
    const statusIndex = embed.data.fields.findIndex(
      f => f.name === "Status"
    );

    embed.data.fields[statusIndex].value = "✅ Approved";

    await message.edit({
      embeds: [embed],
      components: []
    });

    // Give citizen role
    const applicantId = embed.data.fields[0].value.match(/\d+/)[0];
    const member = await interaction.guild.members.fetch(applicantId);

    await member.roles.add(config.citizenRoleId);

    return interaction.reply({
      content: "✅ Application approved.",
      ephemeral: true
    });
  }
/* ---------- DENY ---------- */
if (interaction.customId === "deny") {

  // Admin role check
  if (!interaction.member.roles.cache.has(config.adminRoleId)) {
    return interaction.reply({
      content: "❌ You do not have permission to deny.",
      ephemeral: true
    });
  }

  const {
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder
  } = require("discord.js");

  const modal = new ModalBuilder()
    // 🔑 PASS MESSAGE ID INTO MODAL
    .setCustomId(`deny_reason_modal:${interaction.message.id}`)
    .setTitle("Deny Application");

  const reasonInput = new TextInputBuilder()
    .setCustomId("deny_reason")
    .setLabel("Reason for denial")
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true);

  modal.addComponents(
    new ActionRowBuilder().addComponents(reasonInput)
  );

  return interaction.showModal(modal);
}
};