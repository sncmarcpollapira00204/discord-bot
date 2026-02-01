require("dotenv").config();

const fs = require("fs");
const path = require("path");

const {
  Client,
  Collection,
  GatewayIntentBits,
  Events
} = require("discord.js");

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

/* -------- INTERACTION HANDLERS -------- */

const handleModals = require("./interactions/modals");
const handleButtons = require("./interactions/buttons");

/* -------- COMMAND HANDLER -------- */

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

/* -------- READY -------- */

client.once(Events.ClientReady, () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

/* -------- INTERACTIONS -------- */

client.on(Events.InteractionCreate, async interaction => {
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: "❌ Error executing command.",
        ephemeral: true
      });
    }
  }

  if (interaction.isModalSubmit()) {
    await handleModals(interaction);
  }

  if (interaction.isButton()) {
    await handleButtons(interaction);
  }
});

/* -------- LOGIN -------- */

client.login(process.env.TOKEN);