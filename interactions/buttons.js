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

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const isAdmin = async (interaction) => {
  if (interaction.guild.ownerId === interaction.user.id) return true;
  const member = await interaction.guild.members.fetch(interaction.user.id);
  return member.roles.cache.some(r =>
    config.adminRoleIds.includes(r.id)
  );
};

const getStatusField = (fields) =>
  fields.find(f => f.value?.includes("PENDING") || f.value?.includes("UPDATING"));

const getCharacterName = (fields) => {
  const f = fields.find(x => x.value?.includes("Character Name:"));
  return f
    ? f.value.split("Character Name:")[1]
        .split("\n")[0]
        .replace(/[*_~`|]/g, "")
        .trim()
        .slice(0, 32)
    : null;
};

const animateStatus = async (message, embed, statusField, finalValue) => {
  statusField.value = "🟡 **UPDATING...**";
  embed.setColor(0xffcc00);
  await message.edit({ embeds: [embed] });

  await sleep(1200);

  statusField.value = finalValue;
  embed.setColor(
    finalValue.includes("APPROVED") ? 0x00ff00 : 0xff0000
  );
};

module.exports = async (interaction) => {
  if (!interaction.isButton()) return;

  const message = interaction.message;
  const embed = EmbedBuilder.from(message.embeds[0]);
  const fields = embed.data.fields;

  /*  VOUCH  */

  if (interaction.customId === "vouch") {
    if (!interaction.member.roles.cache.has(config.citizenRoleId)) {
      return interaction.reply({ content: "❌ Citizens only.", ephemeral: true });
    }

    const vouchField = fields.find(f => f.name.includes("VOUCHED"));
    if (!vouchField) return;

    const user = interaction.user.toString();
    let vouches = vouchField.value === "None"
      ? []
      : vouchField.value.split(", ");

    vouches.includes(user)
      ? vouches = vouches.filter(v => v !== user)
      : vouches.push(user);

    vouchField.value = vouches.length ? vouches.join(", ") : "None";

    await message.edit({ embeds: [embed] });
    return interaction.reply({ content: "🖐️ Vouch updated.", ephemeral: true });
  }

  /*  APPROVE  */

  if (interaction.customId === "approve") {
    if (!(await isAdmin(interaction))) {
      return interaction.reply({ content: "❌ No permission.", ephemeral: true });
    }

    const statusField = getStatusField(fields);
    const userField = fields.find(f => f.value?.includes("User:"));
    const charName = getCharacterName(fields);

    await animateStatus(message, embed, statusField, "✅ **APPROVED**");

    embed.addFields({
      name: "✅ **APPROVED BY**",
      value: `${interaction.user}`
    });

    await message.edit({ embeds: [embed], components: [] });

    const userId = userField.value.match(/\d+/)?.[0];
    const member = await interaction.guild.members.fetch(userId);
    await member.roles.add(config.citizenRoleId).catch(() => {});
    await member.setNickname(charName).catch(() => {});

    return interaction.reply({ content: "✅ Application approved.", ephemeral: true });
  }

  /*  DENY  */

  if (interaction.customId === "deny") {
    if (!(await isAdmin(interaction))) {
      return interaction.reply({ content: "❌ No permission.", ephemeral: true });
    }

    const modal = new ModalBuilder()
      .setCustomId(`deny_reason:${message.id}`)
      .setTitle("Deny Application")
      .addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("reason")
            .setLabel("Reason")
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
        )
      );

    return interaction.showModal(modal);
  }
};