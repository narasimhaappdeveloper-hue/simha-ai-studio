
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json"
    }
  });
}

const SYSTEM_PROMPT = `
You are SIMHA AI Studio, an intelligent AI assistant
and professional software development helper.

LANGUAGE:
- Reply in the same language as the user.
- Support Telugu and English.
- Explain technical topics in simple language.

GENERAL AI:
- Understand the user's complete request.
- Give accurate, useful and direct answers.
- Remember the conversation context provided to you.
- Do not repeat unnecessary information.
- Ask one question only when essential information is missing.

DEVELOPMENT CAPABILITIES:

1. WEBSITE CREATOR
Create complete websites using HTML, CSS and JavaScript.
Build responsive mobile-first designs.
Create working forms, navigation, buttons and interactions.

2. APP CREATOR
Help create mobile-friendly web applications.
Explain PWA and Android app options.
Never claim an APK was generated unless it actually was.

3. SOFTWARE CREATOR
Help design business software.
Support frontend, backend, database and authentication architecture.
Create features based on user requirements.

4. CODE GENERATOR
Provide complete code when requested.
Mention the exact filename.
Clearly explain whether code replaces the entire file
or only a specific section.
Avoid incomplete code.

5. ERROR DETECTION AND FIXING
Analyze the supplied code and error messages.
Find likely causes.
Provide corrected code.
Explain how to test the correction.
Never claim code was tested or fixed without actual testing.

6. PROJECT DEVELOPMENT
Break large projects into manageable steps.
Preserve existing features when updating code.
Explain dependencies and deployment requirements.

IMPORTANT RULES:
- Do not invent API keys, passwords or credentials.
- Never ask users to share secret tokens.
- Do not claim to access or modify GitHub without authorization.
- Do not claim to execute code without an execution environment.
- Explain external services and possible costs honestly.
- Prefer free solutions when possible.

RESPONSE QUALITY:
- Be helpful, accurate and practical.
- Use clear headings and examples where useful.
- For coding requests, provide usable code.
- Avoid unnecessary long explanations.
`;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });
    }

    if (
      request.method === "GET" &&
      (url.pathname === "/" || url.pathname === "/health")
    ) {
      return json({
        success: true,
        backend: "SIMHA AI Studio",
        status: "online",
        model: "@cf/zai-org/glm-4.7-flash",
        aiBinding: Boolean(env.AI)
      });
    }

    if (
      url.pathname === "/api/chat" &&
      request.method === "POST"
    ) {
      try {
        if (!env.AI) {
          return json({
            success: false,
            error: "AI binding is not configured"
          }, 500);
        }

        let body;

        try {
          body = await request.json();
        } catch {
          return json({
            success: false,
            error: "Invalid JSON request"
          }, 400);
        }

        const message = body.message;

        if (
          typeof message !== "string" ||
          !message.trim()
        ) {
          return json({
            success: false,
            error: "Please enter a message"
          }, 400);
        }

        const result = await env.AI.run(
          "@cf/zai-org/glm-4.7-flash",
          {
            messages: [
              {
                role: "system",
                content: SYSTEM_PROMPT
              },
              {
                role: "user",
                content: message.trim()
              }
            ],

            max_completion_tokens: 4096,
            reasoning_effort: "low",

            chat_template_kwargs: {
              enable_thinking: false
            },

            temperature: 0.6
          }
        );

        const choice = result?.choices?.[0];
        const content = choice?.message?.content;

        let reply = "";

        if (typeof content === "string") {
          reply = content.trim();
        } else if (Array.isArray(content)) {
          reply = content
            .filter(item => item?.type === "text")
            .map(item => item.text || "")
            .join("\n")
            .trim();
        }

        if (!reply && typeof result?.response === "string") {
          reply = result.response.trim();
        }

        if (!reply) {
          return json({
            success: false,
            error: "AI returned an empty answer. Please try again."
          }, 502);
        }

        return json({
          success: true,
          reply: reply,
          model: "@cf/zai-org/glm-4.7-flash"
        });

      } catch (error) {
        return json({
          success: false,
          error: error.message || "AI request failed"
        }, 500);
      }
    }

    return json({
      success: false,
      error: "Route not found"
    }, 404);
  }
};
