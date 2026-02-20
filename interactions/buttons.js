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

// ELSE JUST APPROVE WITHOUT SETTING NICKNAME
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
  
  // ONLY HANDLE WHITELIST BUTTONS
const whitelistButtons = [
  "open_whitelist_modal",
  "vouch",
  "approve",
  "deny"
];

if (!whitelistButtons.includes(interaction.customId)) {
  return;
}

    // 📄 OPEN WHITELIST APPLICATION MODAL
  if (interaction.customId === "open_whitelist_modal") {

    // ❌ Block citizens
    if (interaction.member.roles.cache.has(config.citizenRoleId)) {
      return interaction.reply({
        content: "❌ You are already a **CITIZEN**.",
        flags: 64
      });
    }

    const modal = new ModalBuilder()
      .setCustomId("whitelist_submit")
      .setTitle("📄 Whitelist Application");

    const characterName = new TextInputBuilder()
      .setCustomId("character_name")
      .setLabel("Character Name")
      .setPlaceholder("Firstname Lastname")
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const age = new TextInputBuilder()
      .setCustomId("age")
      .setLabel("Character Age")
      .setPlaceholder("18+")
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const steamProfile = new TextInputBuilder()
      .setCustomId("steam_profile")
      .setLabel("Steam Profile URL")
      .setPlaceholder("https://steamcommunity.com/id/yourname")
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(characterName),
      new ActionRowBuilder().addComponents(age),
      new ActionRowBuilder().addComponents(steamProfile)
    );

    return interaction.showModal(modal);
  }

  const message = interaction.message;
  if (!message.embeds.length) return;

  const embed = EmbedBuilder.from(message.embeds[0]);
  const fields = embed.data.fields;

    /* STATUS CHECKER */

    const statusField = fields.find(f =>
      f.name === "\u200B" && f.value.includes("PENDING REVIEW")
    );

/* VOUCH - BUTTONS CONFIG */
  
    if (interaction.customId === "vouch") {

      // role check
      if (!interaction.member.roles.cache.has(config.citizenRoleId)) {
        return interaction.reply({
          content: "❌ Only **Citizens** can vouch.",
          flags: 64
        });
      }

      // status check
      if (!statusField) {
        return interaction.reply({
          content: "❌ Application is not pending.",
          flags: 64
        });
      }

      // applicant ID
      const userField = fields.find(f => f.value?.includes("Discord User:"));
      const applicantId = userField?.value.match(/\d+/)?.[0];

      if (!applicantId) {
        return interaction.reply({
          content: "❌ Applicant not found.",
          flags: 64
        });
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
        f.name.toUpperCase().includes("VOUCHED BY")
      );

      if (!vouchField) {
        return interaction.reply({
          content: "❌ Vouch data missing.",
          flags: 64
        });
      }

      // ✅ DEFINE vouches FIRST (FIX)
      let vouches = vouchField.value.trim().toLowerCase() === "none"
        ? []
        : vouchField.value.split(", ").filter(Boolean);

      const voucher = interaction.user.toString();

      // ✅ max vouch limit
      if (vouches.length >= 5 && !vouches.includes(voucher)) {
        return interaction.reply({
          content: "❌ Maximum vouches reached.",
          flags: 64
        });
      }

      // toggle vouch
      if (vouches.includes(voucher)) {
        vouches = vouches.filter(v => v !== voucher);
      } else {
        vouches.push(voucher);
      }

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

      // 🔒 PREVENT DOUBLE APPROVE
    if (!statusField.value.includes("PENDING")) {
      return interaction.reply({
        content: "❌ This application was already handled.",
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

    if (!fields.some(f => f.name.includes("APPROVED BY"))) {
      embed.addFields({
        name: "✅ **APPROVED BY**",
        value: `${interaction.user}`
      });
    }
    
    await message.edit({
      embeds: [embed],
      components: []
    });

    const userId = userField.value.match(/\d+/)?.[0];
    if (!userId) return;

    const member = await interaction.guild.members.fetch(userId);
    
    // Add citizen role
    await member.roles.add(config.citizenRoleId).catch(() => {});
    
    // Track nickname result
    let nicknameSet = false;

    // Set nickname to character name if possible
    if (characterName.length > 0) {
      try {
        await member.setNickname(characterName);
        nicknameSet = true;
      } catch (err) {
        console.error("Nickname error:", err);
      }
    }

    // Response message with nickname info
    return interaction.reply({
      content: nicknameSet
        ? `✅ Application approved.\nNickname set to **${characterName}**`
        : `✅ Application approved.\n⚠️ Nickname could not be set.`,
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

      // 🔒 PREVENT DOUBLE DENY
    if (!statusField || !statusField.value.includes("PENDING")) {
      return interaction.reply({
        content: "❌ This application was already handled.",
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
