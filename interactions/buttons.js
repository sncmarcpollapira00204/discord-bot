const {
  EmbedBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder
} = require("discord.js");

const config = require("../config.json");

/* =======================================================
   ADMIN HELPER (CACHE-SAFE + OWNER BYPASS)
   ======================================================= */
const isAdmin = async (interaction) => {
  // Server owner always allowed
  if (interaction.guild.ownerId === interaction.user.id) return true;

  // Always fetch full member (fixes cache issues)
  const member = await interaction.guild.members.fetch(interaction.user.id);

  return member.roles.cache.some(role =>
    config.adminRoleIds.includes(role.id)
  );
};

module.exports = async (interaction) => {
  if (!interaction.isButton()) return;

  const message = interaction.message;
  const embed = EmbedBuilder.from(message.embeds[0]);

  /* ---------- HELPERS ---------- */
  const getField = (name) =>
    embed.data.fields.find(f => f.name.includes(name));

  const statusField = getField("Status");

  /* =======================================================
     VOUCH (TOGGLE)
     ======================================================= */
  if (interaction.customId === "vouch") {

    if (!interaction.member.roles.cache.has(config.citizenRoleId)) {
      return interaction.reply({
        content: "❌ Only Citizens can vouch.",
        ephemeral: true
      });
    }

    if (!statusField || !statusField.value.includes("Pending")) {
      return interaction.reply({
        content: "❌ You can only vouch while the application is pending.",
        ephemeral: true
      });
    }

    const vouchField = getField("Vouched By");
    if (!vouchField) {
      return interaction.reply({
        content: "❌ Vouch field missing.",
        ephemeral: true
      });
    }

    const voucher = interaction.user.toString();

    let vouches =
      vouchField.value === "None"
        ? []
        : vouchField.value.split(", ").filter(Boolean);

    if (vouches.includes(voucher)) {
      vouches = vouches.filter(v => v !== voucher);
    } else {
      vouches.push(voucher);
    }

    vouchField.value = vouches.length ? vouches.join(", ") : "None";

    await message.edit({ embeds: [embed] });

    return interaction.reply({
      content: vouches.includes(voucher)
        ? "🖐️ You vouched this application."
        : "↩️ Your vouch has been removed.",
      ephemeral: true
    });
  }

  /* =======================================================
     APPROVE (FIXED)
     ======================================================= */
  if (interaction.customId === "approve") {

    if (!(await isAdmin(interaction))) {
      return interaction.reply({
        content: "❌ You do not have permission to approve.",
        ephemeral: true
      });
    }

    const applicantField = getField("Applicant");
    const characterField = getField("Character Name");

    if (!applicantField || !statusField) {
      return interaction.reply({
        content: "❌ Application data corrupted.",
        ephemeral: true
      });
    }

    statusField.value = "✅ Approved";

    embed.addFields({
      name: "Approved By",
      value: `${interaction.user}`
    });

    await message.edit({
      embeds: [embed],
      components: []
    });

    const applicantId = applicantField.value.match(/\d+/)[0];
    const member = await interaction.guild.members.fetch(applicantId);

    await member.roles.add(config.citizenRoleId);

    if (characterField) {
      await member.setNickname(characterField.value).catch(() => {});
    }

    return interaction.reply({
      content: "✅ Application approved.",
      ephemeral: true
    });
  }

  /* =======================================================
     DENY (FIXED)
     ======================================================= */
  if (interaction.customId === "deny") {

    if (!(await isAdmin(interaction))) {
      return interaction.reply({
        content: "❌ You do not have permission to deny.",
        ephemeral: true
      });
    }

    const modal = new ModalBuilder()
      .setCustomId(`deny_reason_modal:${message.id}`)
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