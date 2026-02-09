/* PROJECT POBLACION - DISCORD BOT */

/*========================================================
  DISCORD WHITELISTING SYSTEM
  ========================================================*/

  /* DISCORD BUTTONS CONFIGURATION */

  const {
    EmbedBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder
  } = require("discord.js");

const config = require("../config.json");

/* PERMISSION CHECK FOR ADMINS / OWNERS */

const isAdmin = async (interaction) => {
  if (interaction.guild.ownerId === interaction.user.id) return true;

  const member = await interaction.guild.members.fetch(interaction.user.id);
  return member.roles.cache.some(role =>
    config.adminRoleIds.includes(role.id)
  );
};

/* GET CHARACTER NAME AFTER SUBMITTING FORMS */

const getCharacterName = (fields) => {
  const field = fields.find(f =>
    f.value?.includes("Character Name:")
  );

  if (!field) return null;

  return field.value
    .split("Character Name:")[1]
    .split("\n")[0]
    .trim()
    .replace(/[*_~`|]/g, "") // REMOVE SYMBOLS
    .slice(0, 32); // NICKNAME LIMIT
};

/* BUTTONS HANDLER */

module.exports = async (interaction) => {
  if (!interaction.isButton()) return;

  const message = interaction.message;
  if (!message.embeds.length) return;

  const embed = EmbedBuilder.from(message.embeds[0]);
  const fields = embed.data.fields;

/* STATUS CHECKER */

const statusField = fields.find(f =>
  f.value?.includes("PENDING")
);

/* VOUCH - BUTTONS CONFIG */
  
    if (interaction.customId === "vouch") {

      // role check
      if (!interaction.member.roles.cache.has(config.citizenRoleId)) {
        return interaction.reply({ content: "❌ Only **Citizens** can vouch.", flags: 64 });
      }

      // status check
      if (!statusField) {
        return interaction.reply({ content: "❌ Application is not pending.", flags: 64 });
      }

      // applicant ID
      const userField = fields.find(f => f.value?.includes("Discord User:"));
      const applicantId = userField?.value.match(/\d+/)?.[0];

      if (!applicantId) {
        return interaction.reply({ content: "❌ Applicant not found.", flags: 64 });
      }

      // ❌ self-vouch protection
      if (interaction.user.id === applicantId) {
        return interaction.reply({
          content: "❌ You cannot vouch for your own application.",
          flags: 64
        });
      }

      // vouch field
      const vouchField = fields.find(f =>
        f.name.toUpperCase().includes("VOUCHED")
      );

      if (!vouchField) {
        return interaction.reply({
          content: "❌ Vouch data missing.",
          flags: 64
        });
      }

      let vouches = vouchField.value === "None"
        ? []
        : vouchField.value.split(", ").filter(Boolean);

      const voucher = interaction.user.toString();

      vouches.includes(voucher)
        ? vouches = vouches.filter(v => v !== voucher)
        : vouches.push(voucher);

      vouchField.value = vouches.length ? vouches.join(", ") : "None";

      await message.edit({ embeds: [embed] });

      return interaction.reply({
        content: "🖐️ Vouch updated.",
        flags: 64
      });

    }

  /* APPROVE - BUTTONS CONFIG */

  if (interaction.customId === "approve") {

    if (!(await isAdmin(interaction))) {
      return interaction.reply({
        content: "❌ You do not have permission to approve.",
        flags: 64
      });
    }

    const userField = fields.find(f =>
      f.value?.includes("Discord User:")
    );

    if (!userField || !statusField) {
      return interaction.reply({
        content: "❌ Application data corrupted.",
        flags: 64
      });
    }

    const characterName = getCharacterName(fields);
    if (!characterName) {
      return interaction.reply({
        content: "❌ Character name not found.",
        flags: 64
      });
    }

    statusField.value = "✅ **APPROVED**";

    embed.addFields({
      name: "✅ **APPROVED BY**",
      value: `${interaction.user}`
    });

    await message.edit({
      embeds: [embed],
      components: []
    });

    const userId = userField.value.match(/\d+/)?.[0];
    if (!userId) return;

    const member = await interaction.guild.members.fetch(userId);

    await member.roles.add(config.citizenRoleId).catch(() => {});
    await member.setNickname(characterName).catch(() => {});

    return interaction.reply({
      content: `✅ Application approved.\nNickname set to **${characterName}**`,
      flags: 64
    });
  }

/* DENY - BUTTONS CONFIG */

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

    // ONLY RESPONSE
    
    return interaction.showModal(modal);
  }
};
