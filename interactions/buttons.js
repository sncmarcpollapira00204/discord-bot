const {
  EmbedBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder
} = require("discord.js");

const config = require("../config.json");

module.exports = async (interaction) => {
  if (!interaction.isButton()) return;

  const message = interaction.message;
  const embed = EmbedBuilder.from(message.embeds[0]);

  /* ---------- HELPERS ---------- */
  const getField = (name) =>
    embed.data.fields.find(f => f.name.includes(name));

  /* ---------- VOUCH ---------- */
  if (interaction.customId === "vouch") {

    // Citizen role check
    if (!interaction.member.roles.cache.has(config.citizenRoleId)) {
      return interaction.reply({
        content: "❌ You don't have Citizen Role",
        flags: 64
      });
    }

    const vouchField = getField("Vouched By");
    if (!vouchField) {
      return interaction.reply({
        content: "❌ Vouch field missing.",
        flags: 64
      });
    }

    const voucher = interaction.user.toString();
    let currentVouches = vouchField.value;

    if (currentVouches.includes(voucher)) {
      return interaction.reply({
        content: "❌ You already vouched this user.",
        flags: 64
      });
    }

    vouchField.value =
      currentVouches === "None"
        ? voucher
        : `${currentVouches}, ${voucher}`;

    await message.edit({ embeds: [embed] });

    return interaction.reply({
      content: "✅ Vouched successfully.",
      flags: 64
    });
  }

  /* ---------- APPROVE ---------- */
  if (interaction.customId === "approve") {

    // Admin role check
    if (!interaction.member.roles.cache.has(config.adminRoleId)) {
      return interaction.reply({
        content: "❌ You do not have permission to approve.",
        flags: 64
      });
    }

    const applicantField = getField("Applicant");
    const statusField = getField("Status");
    const characterField = getField("Character Name");

    if (!applicantField || !statusField) {
      return interaction.reply({
        content: "❌ Application data corrupted.",
        flags: 64
      });
    }

    // Update status
    statusField.value = "✅ Approved";

    // Approved by
    embed.addFields({
      name: "Approved By",
      value: `${interaction.user}`
    });

    await message.edit({
      embeds: [embed],
      components: []
    });

    // Give citizen role + nickname
    const applicantId = applicantField.value.match(/\d+/)[0];
    const member = await interaction.guild.members.fetch(applicantId);

    await member.roles.add(config.citizenRoleId);

    if (characterField) {
      await member.setNickname(characterField.value).catch(() => {});
    }

    return interaction.reply({
      content: "✅ Application approved.",
      flags: 64
    });
  }

  /* ---------- DENY ---------- */
  if (interaction.customId === "deny") {

    // Admin role check
    if (!interaction.member.roles.cache.has(config.adminRoleId)) {
      return interaction.reply({
        content: "❌ You do not have permission to deny.",
        flags: 64
      });
    }

    const modal = new ModalBuilder()
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
