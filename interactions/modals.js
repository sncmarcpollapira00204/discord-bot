/* PROJECT POBLACION - DISCORD BOT */

/*========================================================
  DISCORD WHITELISTING SYSTEM
  ========================================================*/

  /* MAIN MODAL CONFIGURATION */

const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

const config = require("../config.json");
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const DIVIDER = "━━━━━━━━━━━━━━━━━━━━━━";
const SPACE = "\u200B";

module.exports = async (interaction) => {
  if (!interaction.isModalSubmit()) return;

  /*  SUBMIT  */

  if (interaction.customId === "whitelist_submit") {
    const name = interaction.fields.getTextInputValue("character_name");
    const age = interaction.fields.getTextInputValue("age");
    const steam = interaction.fields.getTextInputValue("steam_profile");

    const created = interaction.user.createdAt;
    const days = Math.floor((Date.now() - created) / 86400000);
    const ageText = `${Math.floor(days / 365)}y ${Math.floor(days % 365 / 30)}m`;

    const embed = new EmbedBuilder()
      .setColor(0xff8c00)
      .setAuthor({ name: "New Whitelist Application" })
      .setThumbnail(interaction.user.displayAvatarURL())
      .addFields(
        { name: DIVIDER, value: "👤 **APPLICANT**" },
        { name: SPACE, value: `**User:** ${interaction.user}\n**Account Age:** ${ageText}` },

        { name: DIVIDER, value: "🎭 **CHARACTER**" },
        { name: SPACE, value: `**Character Name:** ${name}\n**Character Age:** ${age}` },

        { name: DIVIDER, value: "📊 **STATUS**" },
        { name: SPACE, value: "🟡 **PENDING REVIEW**" },

        { name: DIVIDER, value: SPACE },
        { name: "👥 **VOUCHED BY**", value: "None" }
      )
      .setFooter({ text: "Poblacion City Roleplay" })
      .setTimestamp();

    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("vouch").setLabel("Vouch").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("approve").setLabel("Approve").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId("deny").setLabel("Deny").setStyle(ButtonStyle.Danger)
    );

    await interaction.client.channels.cache
      .get(config.whitelistChannelId)
      .send({ embeds: [embed], components: [buttons] });

    return interaction.reply({ content: "✅ Application submitted.", ephemeral: true });
  }

  /*  DENY MODAL FOR STAFF ONLY */

  if (interaction.customId.startsWith("deny_reason:")) {
    const reason = interaction.fields.getTextInputValue("reason");
    const messageId = interaction.customId.split(":")[1];

    const message = await interaction.channel.messages.fetch(messageId);
    const embed = EmbedBuilder.from(message.embeds[0]);
    const statusField = embed.data.fields.find(f => f.value.includes("PENDING"));

    statusField.value = "🟡 **UPDATING...**";
    await message.edit({ embeds: [embed] });
    await sleep(1200);

    statusField.value = "❌ **DENIED**";
    embed.setColor(0xff0000);
    embed.addFields(
      { name: "❌ **DENIED BY**", value: `${interaction.user}` },
      { name: "📄 **REASON**", value: reason }
    );

    await message.edit({ embeds: [embed], components: [] });
    return interaction.reply({ content: "❌ Application denied.", ephemeral: true });
  }
};