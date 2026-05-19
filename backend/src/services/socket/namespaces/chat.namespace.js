/**
 * socket/namespaces/chat.namespace.js
 * Handles all real-time chat events on the /chat namespace.
 */

const registerMessageHandlers  = require("../handlers/message.handler");
const registerTypingHandlers   = require("../handlers/typing.handler");
const registerReactionHandlers = require("../handlers/reaction.handler");
const registerConversationHandlers = require("../handlers/conversation.handler");
const { updatePresence }       = require("../handlers/presence.handler");

/**
 * @param {import("socket.io").Namespace} chatNsp
 */
function registerChatNamespace(chatNsp) {
  chatNsp.use(async (socket, next) => {
    // Namespace-level middleware: join user to their company room
    // so we can broadcast company-scoped events
    next();
  });

  chatNsp.on("connection", async (socket) => {
    const _id = socket.user._id;

    // ── Join personal room (for DMs & notifications) ──────────
    socket.join(`user:${_id}`);

    // ── Join company room (for company-wide broadcasts) ───────
    
    // ── Update presence to online ─────────────────────────────
    await updatePresence(_id, "online", chatNsp);

    // ── Register event handlers ───────────────────────────────
    registerMessageHandlers(socket, chatNsp);
    registerTypingHandlers(socket, chatNsp);
    registerReactionHandlers(socket, chatNsp);
    registerConversationHandlers(socket, chatNsp);

    // ── Disconnect ────────────────────────────────────────────
    socket.on("disconnect", async (reason) => {
      // Check if user has other active sockets (other tabs)
      const sockets = await chatNsp.in(`user:${_id}`).fetchSockets();
      const hasOtherSockets = sockets.some((s) => s.id !== socket.id);

      if (!hasOtherSockets) {
        await updatePresence(_id, "offline", chatNsp);
      }
    });
  });
}

module.exports = registerChatNamespace;