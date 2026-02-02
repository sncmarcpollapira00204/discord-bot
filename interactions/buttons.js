const {
  EmbedBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder
} = require("discord.js");

const config = require("../config.json");

/* ================= ADMIN CHECK ================= */
const isAdmin = async (interaction) => {
  if (interaction.guild.ownerId === interaction.user.id) return true;

  const member = await interaction.guild.members.fetch(interaction.user.id);
  return member.roles.cache.some(role =>
    config.adminRoleIds.includes(role.id)
  );
};

/* ================= HELPER: GET CHARACTER NAME ================= */
const getCharacterName = (fields) => {
  const field = fields.find(f =>
    f.value?.includes("Character Name:")
  );

  if (!field) return null;

  return field.value
    .split("Character Name:")[1]
    .split("\n")[0]
    .trim()
    .replace(/[*_~`|]/g, "") // remove markdown symbols
    .slice(0, 32); // Discord nickname limit
};

/* ================= BUTTON HANDLER ================= */
module.exports = async (interaction) => {
  if (!interaction.isButton()) return;

  const message = interaction.message;
  if (!message.embeds.length) return;

  const embed = EmbedBuilder.from(message.embeds[0]);
  const fields = embed.data.fields;

/* ================= FIND STATUS ================= */
  const statusField = fields.find(f =>
    f.value?.includes("PENDING")
  );

/* ================= VOUCH ================= */
  if (interaction.customId === "vouch") {

    if (!interaction.member.roles.cache.has(config.citizenRoleId)) {
      return interaction.reply({
        content: "❌ Only **Citizens** can vouch.",
        ephemeral: true
      });
    }

    if (!statusField) {
      return interaction.reply({
        content: "❌ You can only vouch while the application is pending.",
        ephemeral: true
      });
    }

    const vouchField = fields.find(f =>
      f.name.toUpperCase().includes("VOUCHED")
    );

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
      content: "🖐️ Vouch updated.",
      ephemeral: true
    });
  }

/* ================= APPROVE ================= */
if (interaction.customId === "approve") {

  if (!(await isAdmin(interaction))) {
    return interaction.reply({
      content: "❌ You do not have permission to approve.",
      ephemeral: true
    });
  }

  // Find fields
  const userField = fields.find(f =>
    f.value?.includes("User:")
  );

  const statusField = fields.find(f =>
    f.value?.includes("PENDING")
  );

  if (!userField || !statusField) {
    return interaction.reply({
      content: "❌ Application data corrupted.",
      ephemeral: true
    });
  }

  // Get character name
  const characterName = getCharacterName(fields);
  if (!characterName) {
    return interaction.reply({
      content: "❌ Character name not found.",
      ephemeral: true
    });
  }

  // Update embed FIRST
  statusField.value = "✅ **APPROVED**";

  embed.addFields({
    name: "✅ **APPROVED BY**",
    value: `${interaction.user}`
  });

  await message.edit({
    embeds: [embed],
    components: []
  });

  // Extract user ID
  const userId = userField.value.match(/\d+/)?.[0];
  if (!userId) return;

  // ✅ FETCH MEMBER FIRST
  const member = await interaction.guild.members.fetch(userId);

  // ✅ THEN USE IT
  await member.roles.add(config.citizenRoleId);
  await member.setNickname(characterName).catch(() => {});

  return interaction.reply({
    content: `✅ Application approved.\nNickname set to **${characterName}**`,
    ephemeral: true
  });
}

/* ================= DENY ================= */
if (interaction.customId === "deny") {

  if (!(await isAdmin(interaction))) {
    return interaction.reply({
      content: "❌ You do not have permission to deny.",
      flags: 64
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

  // 🔑 THIS MUST BE THE ONLY RESPONSE
  return interaction.showModal(modal);
}

};