const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

const config = require("../config.json");

module.exports = async (interaction) => {
  if (!interaction.isModalSubmit()) return;
  if (interaction.customId !== "namechange_submit") return;

  const member = interaction.member;

  // Use nickname if exists, otherwise username
  const currentName = member.nickname || interaction.user.username;
  const newName = interaction.fields.getTextInputValue("new_name");

        const embed = new EmbedBuilder()
        .setColor(0x3498db)
        .setAuthor({
            name: "NAME CHANGE REQUEST",
            iconURL: interaction.guild.iconURL({ dynamic: true, size: 256 })
        })
        .setThumbnail(
            interaction.user.displayAvatarURL({ dynamic: true, size: 256 })
        )
        .addFields(
            { name: "CURRENT NAME", value: currentName },
            { name: "REQUESTED NAME", value: newName },
            { name: "\u200B", value: "🟡 **PENDING REVIEW**" }
        )
        .setFooter({ text: `UID:${interaction.user.id}` })
        .setTimestamp();

  const buttons = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("namechange_approve")
      .setLabel("Approve")
      .setEmoji("✅")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId("namechange_deny")
      .setLabel("Deny")
      .setEmoji("✖️")
      .setStyle(ButtonStyle.Danger)
  );

  // ✅ ACKNOWLEDGE INTERACTION FIRST
  await interaction.reply({
    content: "✅ Name change request submitted.",
    flags: 64
  });

  // ✅ FETCH CHANNEL SAFELY (NO CACHE)
  const channel = await interaction.client.channels.fetch(
    config.whitelistChannelId
  ).catch(() => null);

  if (!channel) return;

  // ✅ SEND REQUEST EMBED
  await channel.send({
    embeds: [embed],
    components: [buttons]
  });
};