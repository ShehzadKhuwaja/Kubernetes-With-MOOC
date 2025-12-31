const { connect, StringCodec } = require("nats");

const NATS_URL = process.env.NATS_URL;
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

if (!DISCORD_WEBHOOK_URL) {
  throw new Error("DISCORD_WEBHOOK_URL is required");
}

const sc = StringCodec();

async function start() {
  const nc = await connect({ servers: NATS_URL });

  console.log("✅ Broadcaster connected to NATS");

  // Queue group prevents duplicate delivery
  const sub = nc.subscribe("todos.events", {
    queue: "broadcaster-group"
  });

  for await (const msg of sub) {
    try {
      const event = JSON.parse(sc.decode(msg.data));
      await sendToDiscord(event);
    } catch (err) {
      console.error("❌ Failed to process message:", err);
      // No retry → duplicates avoided
    }
  }
}

async function sendToDiscord(event) {
  const content = formatDiscordMessage(event);

  await fetch(DISCORD_WEBHOOK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(content)
  });
}

function formatDiscordMessage(event) {
  const action =
    event.event === "todo.created"
      ? "🆕 Todo Created"
      : event.event === "todo.updated"
      ? "✏️ Todo Updated"
      : "📌 Todo Event";

  return {
    username: "Todo Bot",
    avatar_url: "https://i.imgur.com/AfFp7pu.png",
    embeds: [
      {
        title: action,
        color: 5814783,
        fields: [
          { name: "ID", value: event.todoId, inline: true },
          { name: "Status", value: event.status ?? "N/A", inline: true },
          { name: "text", value: event.text ?? "N/A" }
        ],
        timestamp: new Date().toISOString()
      }
    ]
  };
}

start().catch(console.error);
