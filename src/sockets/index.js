const jwt = require("jsonwebtoken");
const User = require("../models/User");
const ChatMessage = require("../models/ChatMessage");

// Authenticates a socket connection using the same JWT issued by /api/auth/login.
// Client should connect with: io(URL, { auth: { token } })
const socketAuth = async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) return next(new Error("Authentication required"));

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return next(new Error("User not found"));

    socket.user = user;
    next();
  } catch (err) {
    next(new Error("Invalid or expired token"));
  }
};

const initSockets = (io) => {
  io.use(socketAuth);

  io.on("connection", (socket) => {
    const { user } = socket;
    console.log(`Socket connected: ${user.fullName || user.email} (${user.role})`);

    // Personal room so we can target notifications/events at a specific user
    socket.join(`user:${user._id}`);
    socket.join(`role:${user.role}`);

    if (user.role === "doctor") {
      io.emit("doctor:status-changed", { doctorId: user._id, status: user.status });
    }

    /* --------------------------- Chat messaging --------------------------- */

    // Join a specific conversation room (Appointment or ConsultationRequest id)
    socket.on("chat:join", ({ conversationId }) => {
      if (!conversationId) return;
      socket.join(`conversation:${conversationId}`);
    });

    socket.on("chat:leave", ({ conversationId }) => {
      if (!conversationId) return;
      socket.leave(`conversation:${conversationId}`);
    });

    // Real-time message send (in addition to the REST POST endpoint)
    socket.on("chat:send", async ({ conversationId, conversationModel, text, attachmentUrl }) => {
      try {
        if (!conversationId || !conversationModel || (!text && !attachmentUrl)) return;

        const message = await ChatMessage.create({
          conversation: conversationId,
          conversationModel,
          sender: user._id,
          senderRole: user.role,
          text,
          attachmentUrl,
        });

        const populated = await message.populate("sender", "firstName lastName avatar role");
        io.to(`conversation:${conversationId}`).emit("chat:message", populated);
      } catch (err) {
        socket.emit("chat:error", { message: "Failed to send message" });
      }
    });

    socket.on("chat:typing", ({ conversationId, isTyping }) => {
      if (!conversationId) return;
      socket.to(`conversation:${conversationId}`).emit("chat:typing", {
        userId: user._id,
        isTyping: !!isTyping,
      });
    });

    /* ---------------------- Video call (WebRTC signaling) ------------------ */
    // A thin signaling relay: clients exchange SDP offers/answers and ICE
    // candidates through the server, then establish a direct peer connection.

    socket.on("video:join", ({ roomId }) => {
      if (!roomId) return;
      socket.join(`video:${roomId}`);
      socket.to(`video:${roomId}`).emit("video:peer-joined", { userId: user._id, name: user.fullName });
    });

    socket.on("video:leave", ({ roomId }) => {
      if (!roomId) return;
      socket.leave(`video:${roomId}`);
      socket.to(`video:${roomId}`).emit("video:peer-left", { userId: user._id });
    });

    socket.on("video:offer", ({ roomId, offer }) => {
      socket.to(`video:${roomId}`).emit("video:offer", { from: user._id, offer });
    });

    socket.on("video:answer", ({ roomId, answer }) => {
      socket.to(`video:${roomId}`).emit("video:answer", { from: user._id, answer });
    });

    socket.on("video:ice-candidate", ({ roomId, candidate }) => {
      socket.to(`video:${roomId}`).emit("video:ice-candidate", { from: user._id, candidate });
    });

    socket.on("video:end-call", ({ roomId }) => {
      io.to(`video:${roomId}`).emit("video:call-ended", { by: user._id });
    });

    /* -------------------------------------------------------------------- */

    socket.on("disconnect", async () => {
      console.log(`Socket disconnected: ${user.fullName || user.email}`);
      if (user.role === "doctor") {
        try {
          user.status = "offline";
          await user.save({ validateBeforeSave: false });
          io.emit("doctor:status-changed", { doctorId: user._id, status: "offline" });
        } catch (err) {
          // ignore
        }
      }
    });
  });
};

module.exports = initSockets;
