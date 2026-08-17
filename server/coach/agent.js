import { TOOLS, TOOL_SCHEMAS } from './tools.js';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
// Picked from this account's live /v1/models list — must support "tools" in
// supported_features. gpt-oss-120b is the largest of Groq's tool-capable
// text models at time of writing; swap here if that changes.
const MODEL = 'openai/gpt-oss-120b';
const MAX_TOOL_ROUNDS = 6;

const SYSTEM_PROMPT = `You are Elite's AI training coach. You have tools that pull the user's real workout, food, cardio, and body-weight history from their own log — always call a tool instead of guessing at their numbers. Cross-reference multiple tools when a question needs it (a plateau question needs both exercise trend and recent workout history; a nutrition-vs-training question needs both nutrition trend and workout/muscle volume). Keep answers concise, specific, and grounded in the numbers you retrieved. If a tool comes back empty for the range asked, say so rather than inventing numbers. You are not a doctor — for injury or medical concerns, say so and suggest professional advice.`;

/** Runs the Groq tool-calling loop to completion and returns the final
 * assistant text. `history` is the prior conversation (user/assistant turns
 * only — no system message, that's added here). */
export async function runCoachAgent(history) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY is not configured on the server.');

  const messages = [{ role: 'system', content: SYSTEM_PROMPT }, ...history];

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: MODEL, messages, tools: TOOL_SCHEMAS, tool_choice: 'auto', temperature: 0.4 }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Groq API error ${res.status}: ${text.slice(0, 300)}`);
    }
    const data = await res.json();
    const message = data.choices[0].message;
    messages.push(message);

    const toolCalls = message.tool_calls;
    if (!toolCalls || toolCalls.length === 0) {
      return message.content ?? '';
    }

    for (const call of toolCalls) {
      const fn = TOOLS[call.function.name];
      let result;
      try {
        const args = call.function.arguments ? JSON.parse(call.function.arguments) : {};
        result = fn ? fn(args) : { error: `Unknown tool "${call.function.name}"` };
      } catch (e) {
        result = { error: String(e?.message ?? e) };
      }
      messages.push({ role: 'tool', tool_call_id: call.id, content: JSON.stringify(result) });
    }
  }

  return "I wasn't able to finish looking that up — try asking again, maybe with a narrower question.";
}
