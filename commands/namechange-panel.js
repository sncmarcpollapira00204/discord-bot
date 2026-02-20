const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

const config = require("../config.json"); // ✅ ADD THIS

module.exports = {
  data: new SlashCommandBuilder()
    .setName("namechange-panel")
    .setDescription("Send the name change request panel"),

  async execute(interaction) {

    // ✅ ROLE-BASED ADMIN CHECK
    const isAdmin =
      interaction.guild.ownerId === interaction.user.id ||
      interaction.member.roles.cache.some(role =>
        config.adminRoleIds.includes(role.id)
      );

    if (!isAdmin) {
      return interaction.reply({
        content: "❌ You do not have permission to use this.",
        flags: 64
      });
    }

    const embed = new EmbedBuilder()
      .setColor(0xffa500)
      .setAuthor({
        name: "NAME CHANGE REQUEST",
        iconURL: interaction.guild.iconURL({ dynamic: true })
      })
      .setDescription(
        "**Welcome to Poblacion City Roleplay**\n\n" +
        "Click the button below to request an RP name change.\n\n" +
        "⚠️ **Rules:**\n" +
        "• Proper RP format (Firstname Lastname)\n" +
        "• Lore-friendly names only\n" +
        "• Staff approval required"
      )
      .setThumbnail(
        "https://cdn.discordapp.com/attachments/1466355570805313719/1466355571706826842/Poblagif1.gif?ex=699a1b4b&is=6998c9cb&hm=dbe32e1921c864b9a029d05a5ae854f5b6bbd4ea6f3d32ae701bbf3a57bfdb85"
      )
      .setImage(
        "https://cdn.discordapp.com/attachments/1466355570805313719/1466783941867339888/gif_tag_3.gif?ex=6999afff&is=69985e7f&hm=c9c270ea190d78ef1448aa33c5ea5056900f2bd9dac2233be9703ff6b2838a97"
      )
      .setFooter({ text: "Poblacion City Roleplay" });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("open_namechange_modal")
        .setLabel("Request Name Change")
        .setEmoji("✏️")
        .setStyle(ButtonStyle.Primary)
    );

      try {
        await interaction.channel.send({
          embeds: [embed],
          components: [row]
        });
      } catch (err) {
        console.error("❌ Failed to send panel:", err);

        return interaction.reply({
          content: "❌ Bot cannot send messages in this channel. Please check permissions.",
          flags: 64
        });
      }

    return interaction.reply({
      content: "✅ Name change panel sent.",
      flags: 64
    });
  }
};