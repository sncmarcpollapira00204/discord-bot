const {
  EmbedBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder
} = require("discord.js");

const config = require("../config.json");

// Discord Owner bypass perms

const isAdmin = async (interaction) => {

  if (interaction.guild.ownerId === interaction.user.id) return true;

  const member = await interaction.guild.members.fetch(interaction.user.id);

  return member.roles.cache.some(role =>
    config.adminRoleIds.includes(role.id)
  );
};

module.exports = async (interaction) => {
  if (!interaction.isButton()) return;

  const message = interaction.message;
  const embed = EmbedBuilder.from(message.embeds[0]);

  const getField = (name) =>
    embed.data.fields.find(f =>
      f.name.toLowerCase().includes(name.toLowerCase())
    );

  const statusField = getField("status");

// Vouching System buttons
  if (interaction.customId === "vouch") {

    if (!interaction.member.roles.cache.has(config.citizenRoleId)) {
      return interaction.reply({
        content: "❌ Only Citizens can vouch.",
        ephemeral: true
      });
    }

    if (!statusField || !statusField.value.toLowerCase().includes("pending")) {
      return interaction.reply({
        content: "❌ You can only vouch while the application is pending.",
        ephemeral: true
      });
    }

    const vouchField = getField("vouched");
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

// Approve buttons
  if (interaction.customId === "approve") {

    if (!(await isAdmin(interaction))) {
      return interaction.reply({
        content: "❌ You do not have permission to approve.",
        ephemeral: true
      });
    }

    const applicantField = getField("user");
    const characterField = getField("character");

    if (!applicantField || !statusField) {
      return interaction.reply({
        content: "❌ Application data corrupted.",
        ephemeral: true
      });
    }

    statusField.value = "🟢 **APPROVED**";
    embed.setColor(0x22c55e);

    embed.addFields({
      name: "✅ Approved By",
      value: `${interaction.user}`
    });

    await message.edit({
      embeds: [embed],
      components: []
    });

    const applicantId = applicantField.value.match(/\d+/)?.[0];
    if (!applicantId) return;

    const member = await interaction.guild.members.fetch(applicantId);

    await member.roles.add(config.citizenRoleId);

    if (characterField) {
      const nameLine = characterField.value.split("\n")[0];
      const nickname = nameLine.replace("**Character Name:**", "").trim();
      await member.setNickname(nickname).catch(() => {});
    }

    return interaction.reply({
      content: "✅ Application approved.",
      ephemeral: true
    });
  }

// Denied buttons
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