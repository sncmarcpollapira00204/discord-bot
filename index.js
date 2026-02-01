require("dotenv").config();

const fs = require("fs");
const path = require("path");

const {
  Client,
  Collection,
  GatewayIntentBits,
  Events
} = require("discord.js");

/* =======================================================
   CLIENT SETUP (INTENTS FIXED)
   ======================================================= */
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,     // ✅ REQUIRED for role checks
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

/* =======================================================
   INTERACTION HANDLERS
   ======================================================= */
const handleModals = require("./interactions/modals");
const handleButtons = require("./interactions/buttons");

/* =======================================================
   COMMAND HANDLER
   ======================================================= */
client.commands = new Collection();

const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs
  .readdirSync(commandsPath)
  .filter(file => file.endsWith(".js"));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);

  if ("data" in command && "execute" in command) {
    client.commands.set(command.data.name, command);
  }
}

/* =======================================================
   READY EVENT
   ======================================================= */
client.once(Events.ClientReady, () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

/* =======================================================
   INTERACTION ROUTER
   ======================================================= */
client.on(Events.InteractionCreate, async interaction => {
  try {
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;

      await command.execute(interaction);
    }

    if (interaction.isModalSubmit()) {
      await handleModals(interaction);
    }

    if (interaction.isButton()) {
      await handleButtons(interaction);
    }
  } catch (error) {
    console.error("❌ Interaction error:", error);

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: "❌ An error occurred.",
        ephemeral: true
      });
    } else {
      await interaction.reply({
        content: "❌ An error occurred.",
        ephemeral: true
      });
    }
  }
});

/* =======================================================
   LOGIN
   ======================================================= */
client.login(process.env.TOKEN);