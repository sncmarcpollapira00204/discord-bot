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
/* ---------- VOUCH (TOGGLE) ---------- */
if (interaction.customId === "vouch") {

  // Citizen role check
  if (!interaction.member.roles.cache.has(config.citizenRoleId)) {
    return interaction.reply({
      content: "❌ Only Citizens can vouch.",
      flags: 64
    });
  }

  const statusField = embed.data.fields.find(f =>
    f.name.includes("Status")
  );

  if (!statusField || !statusField.value.includes("Pending")) {
    return interaction.reply({
      content: "❌ You can only vouch while the application is pending.",
      flags: 64
    });
  }

  const vouchField = embed.data.fields.find(f =>
    f.name.includes("Vouched By")
  );

  if (!vouchField) {
    return interaction.reply({
      content: "❌ Vouch field missing.",
      flags: 64
    });
  }

  const voucher = interaction.user.toString();

  // Normalize vouches into array
  let vouches =
    vouchField.value === "None"
      ? []
      : vouchField.value.split(", ").filter(Boolean);

  // TOGGLE LOGIC
  if (vouches.includes(voucher)) {
    // REMOVE VOUCH
    vouches = vouches.filter(v => v !== voucher);
  } else {
    // ADD VOUCH
    vouches.push(voucher);
  }

  // Update field
  vouchField.value = vouches.length ? vouches.join(", ") : "None";

  await message.edit({ embeds: [embed] });

  return interaction.reply({
    content: vouches.includes(voucher)
      ? "🖐️ You vouched this application."
      : "↩️ Your vouch has been removed.",
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
