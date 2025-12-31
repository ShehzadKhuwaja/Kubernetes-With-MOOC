const { connect, StringCodec } = require("nats");

let nc;
const sc = StringCodec();

async function initNats() {
  if (!nc) {
    nc = await connect({ servers: process.env.NATS_URL || "nats://nats:4222" });
    console.log("✅ Connected to NATS");
  }
  return nc;
}

async function publishTodoEvent(event) {
  if (!nc) {
    throw new Error("NATS not initialized");
  }

  nc.publish(
    "todos.events",
    sc.encode(JSON.stringify(event))
  );
}

module.exports = {
  initNats,
  publishTodoEvent
};