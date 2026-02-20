const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  EmbedBuilder
} = require("discord.js");

const config = require("../config.json");

/* ADMIN CHECK */
const isAdmin = async (interaction) => {
  if (interaction.guild.ownerId === interaction.user.id) return true;
  const member = await interaction.guild.members.fetch(interaction.user.id);
  return member.roles.cache.some(role =>
    config.adminRoleIds.includes(role.id)
  );
};

module.exports = async (interaction) => {
  if (!interaction.isButton()) return;

  /* =====================
     OPEN MODAL
     ===================== */
  if (interaction.customId === "open_namechange_modal") {

    if (!interaction.member.roles.cache.has(config.citizenRoleId)) {
      return interaction.reply({
        content: "❌ Only **Citizens** can request a name change.",
        flags: 64
      });
    }

    const modal = new ModalBuilder()
      .setCustomId("namechange_submit")
      .setTitle("✏️ Name Change Request");

    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("new_name")
          .setLabel("New RP Name")
          .setPlaceholder("Firstname Lastname")
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
      )
    );

    return interaction.showModal(modal);
  }

  /* =====================
     APPROVE
     ===================== */
  if (interaction.customId === "namechange_approve") {

    if (!(await isAdmin(interaction))) {
      return interaction.reply({ content: "❌ No permission.", flags: 64 });
    }

    const embed = EmbedBuilder.from(interaction.message.embeds[0]);

    /* GET USER ID FROM FOOTER */
    const footerText = embed.data.footer?.text;
    const userId = footerText?.startsWith("UID:")
      ? footerText.replace("UID:", "")
      : null;

    if (!userId) {
      return interaction.reply({
        content: "❌ User data missing. Cannot change name.",
        flags: 64
      });
    }

    /* GET REQUESTED NAME */
    const newName = embed.data.fields.find(
      f => f.name === "REQUESTED NAME"
    )?.value;

    if (!newName) {
      return interaction.reply({
        content: "❌ Requested name not found.",
        flags: 64
      });
    }

    const member = await interaction.guild.members.fetch(userId).catch(() => null);

    if (!member) {
      return interaction.reply({
        content: "❌ User not found in server.",
        flags: 64
      });
    }

    /* SET NICKNAME */
    try {
      await member.setNickname(newName.slice(0, 32));
    } catch {
      return interaction.reply({
        content: "⚠️ Approved, but bot cannot change nickname (permissions).",
        flags: 64
      });
    }

    /* UPDATE EMBED STATUS */
    embed.data.fields[embed.data.fields.length - 1].value = "✅ **APPROVED**";
    embed.addFields({ name: "✅ APPROVED BY", value: `${interaction.user}` });

    await interaction.message.edit({
      embeds: [embed],
      components: []
    });

    return interaction.reply({
      content: `✅ Name changed to **${newName}**`,
      flags: 64
    });
  }

  /* =====================
     DENY
     ===================== */
  if (interaction.customId === "namechange_deny") {

    if (!(await isAdmin(interaction))) {
      return interaction.reply({ content: "❌ No permission.", flags: 64 });
    }

    const embed = EmbedBuilder.from(interaction.message.embeds[0]);
    embed.data.fields[embed.data.fields.length - 1].value = "❌ **DENIED**";
    embed.addFields({ name: "❌ DENIED BY", value: `${interaction.user}` });

    await interaction.message.edit({
      embeds: [embed],
      components: []
    });

    return interaction.reply({
      content: "❌ Name change denied.",
      flags: 64
    });
  }
};