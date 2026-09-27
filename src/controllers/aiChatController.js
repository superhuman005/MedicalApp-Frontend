const catchAsync = require("../utils/catchAsync");
const ApiError = require("../utils/ApiError");

const SYSTEM_PROMPT = `You are a helpful AI health assistant inside a telemedicine app called TeleMed.
You can discuss symptoms, medications, and general wellness information in plain, reassuring language.
You are NOT a doctor: always include a brief reminder to consult a licensed physician for diagnosis,
prescriptions, or anything urgent. If the user describes an emergency (e.g. chest pain, difficulty
breathing, severe bleeding, stroke symptoms), tell them to call emergency services immediately.`;

// A small rule-based fallback so the endpoint is useful out of the box even
// without an ANTHROPIC_API_KEY configured.
const fallbackResponse = (message) => {
  const lower = message.toLowerCase();
  if (/chest pain|can't breathe|cannot breathe|severe bleeding|stroke|suicide/.test(lower)) {
    return "This sounds like it could be an emergency. Please call your local emergency number or go to the nearest emergency room right away. I'm not able to provide emergency care.";
  }
  return (
    "Thanks for sharing that. I can offer general information, but I'm not a substitute for a licensed " +
    "doctor. Based on what you've described, it may help to note when your symptoms started, how severe " +
    "they are, and anything that makes them better or worse — then share that with one of the doctors on " +
    "TeleMed for a proper evaluation. Would you like me to help you find a doctor or book a consultation?"
  );
};

// @desc    Send a message to the AI health assistant
// @route   POST /api/ai-chat
// @access  Private (patient)
const chat = catchAsync(async (req, res) => {
  const { message, history } = req.body;
  if (!message || typeof message !== "string") {
    throw new ApiError(400, "message is required");
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return res.status(200).json({
      success: true,
      reply: fallbackResponse(message),
      source: "fallback",
    });
  }

  try {
    const messages = [
      ...(Array.isArray(history)
        ? history
            .filter((m) => m && m.content)
            .map((m) => ({ role: m.role === "ai" ? "assistant" : "user", content: m.content }))
        : []),
      { role: "user", content: message },
    ];

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 500,
        system: SYSTEM_PROMPT,
        messages,
      }),
    });

    if (!response.ok) {
      throw new Error(`Upstream AI request failed with status ${response.status}`);
    }

    const data = await response.json();
    const reply = data.content?.map((block) => block.text || "").join("\n") || fallbackResponse(message);

    res.status(200).json({ success: true, reply, source: "ai" });
  } catch (err) {
    // Never fail the request just because the AI provider is unavailable
    res.status(200).json({ success: true, reply: fallbackResponse(message), source: "fallback" });
  }
});

module.exports = { chat };
