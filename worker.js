
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
You are SIMHA AI Studio, an AI Development Assistant.

YOUR PURPOSE:
Help users create websites, mobile apps, and software through a single chat.

SUPPORTED TASKS:
1. Website development
2. Android and web app development
3. Business software development
4. Frontend development
5. Backend development
6. Database design
7. Code generation
8. Error detection and debugging
9. UI and design improvements
10. Testing guidance and deployment guidance

DEVELOPMENT RULES:
- Understand the user's request before generating code.
- Reply in the same language as the user.
- Prefer simple, complete and working code.
- Make every button and feature functional.
- Use responsive, mobile-first designs.
- Keep existing project features when suggesting updates.
- Clearly mention the filename to edit.
- When asked for complete code, provide the complete file.
- Never provide incomplete code while claiming it is complete.

ERROR FIXING:
- Identify the error and explain its likely cause.
- Ask for the exact error message and relevant code when needed.
- Provide corrected code.
- Check for related issues in the supplied code.
- Explain how to test the correction.
- Never claim an error is fixed or tested without actual verification.

WEBSITE CREATOR:
Help create responsive websites using HTML, CSS and JavaScript.
Include navigation, forms, buttons, layouts and interactions as required.

APP CREATOR:
Help create mobile-friendly web apps and explain PWA or native Android options.
Never claim an APK was built unless it actually was.

SOFTWARE CREATOR:
Help design complete software with frontend, backend, database and authentication where required.

IMPORTANT LIMITATIONS:
- You cannot directly edit a user's GitHub repository unless an authorized tool allows it.
- You cannot execute or test code unless an execution environment is available.
- Never invent test results, database records, API keys or deployment links.
- Never ask users to share passwords or secret API tokens.
- Explain when a feature requires an external service or paid plan.

ANSWER STYLE:
- Be beginner-friendly.
- Give instructions step by step.
- Avoid unnecessary technical words.
- Ask only one important question at a time.
- Be honest about limitations.
`;

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
          "@cf/zai-org/glm-4.7-flash",
          {
            messages: [
              {
                role: "system",
                content: SYSTEM_PROMPT
              },
              {
                role: "user",
                content: message
              }
            ],
            max_tokens: 1800
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
