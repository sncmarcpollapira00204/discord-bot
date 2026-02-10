const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("whitelist-panel")
    .setDescription("Send the whitelist application embed"),

  async execute(interaction) {

    // OPTIONAL: Admin only
    if (!interaction.member.permissions.has("Administrator")) {
      return interaction.reply({
        content: "❌ You do not have permission to use this.",
        flags: 64
      });
    }

        const embed = new EmbedBuilder()
        .setColor(0xff8c00)
        .setTitle("📄 Whitelist Application Form")
        .setDescription(
            "Welcome to **Poblacion City Roleplay**.\n\n" +
            "Click the button below to apply for whitelist access.\n\n" +
            "⚠️ **Whitelisting Rules:**\n" +
            "• One application only\n" +
            "• Troll applications = instant deny\n" +
            "• Follow server RP rules"
        )
        .setThumbnail(
            "https://cdn.discordapp.com/attachments/1466355570805313719/1466355571706826842/Poblagif1.gif"
        )
        .setImage(
            "https://cdn.discordapp.com/attachments/1466355570805313719/1466783941867339888/gif_tag_3.gif"
        )
        .setFooter({ text: "Poblacion City Roleplay" });



    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("open_whitelist_modal")
        .setLabel("Apply for Whitelist")
        .setEmoji("📄")
        .setStyle(ButtonStyle.Primary)
    );

    await interaction.channel.send({
      embeds: [embed],
      components: [row]
    });

    return interaction.reply({
      content: "✅ Whitelist application embed sent.",
      flags: 64
    });
  }
};