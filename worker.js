
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

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (url.pathname === "/" || url.pathname === "/health") {
      return json({
        success: true,
        backend: "SIMHA AI Studio",
        status: "online",
        aiBinding: Boolean(env.AI)
      });
    }

    if (url.pathname === "/api/chat" && request.method === "POST") {
      try {
        if (!env.AI) {
          return json({
            success: false,
            error: "Workers AI binding AI is missing"
          }, 500);
        }

        const body = await request.json();
        const message = body.message;

        if (!message || typeof message !== "string") {
          return json({
            success: false,
            error: "Please enter a message"
          }, 400);
        }

        const result = await env.AI.run(
          "@cf/meta/llama-3.1-8b-instruct-fp8",
          {
            messages: [
              {
                role: "system",
                content: "You are SIMHA AI, a helpful assistant. Give clear, practical answers. Reply in the same language as the user."
              },
              {
                role: "user",
                content: message
              }
            ],
            max_tokens: 700
          }
        );

        return json({
          success: true,
          reply: result.response || "No response received"
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
