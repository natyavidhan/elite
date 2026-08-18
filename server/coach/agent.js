import { TOOLS, TOOL_SCHEMAS } from './tools.js';
import { COACH_API_KEY, COACH_BASE_URL, COACH_MODEL } from './config.js';

const MAX_TOOL_ROUNDS = 6;

const SYSTEM_PROMPT = `You are Elite's AI training coach. You have tools that pull the user's real workout, food, cardio, and body-weight history from their own log — always call a tool instead of guessing at their numbers. Cross-reference multiple tools when a question needs it (a plateau question needs both exercise trend and recent workout history; a nutrition-vs-training question needs both nutrition trend and workout/muscle volume). Keep answers concise, specific, and grounded in the numbers you retrieved. If a tool comes back empty for the range asked, say so rather than inventing numbers. You are not a doctor — for injury or medical concerns, say so and suggest professional advice. When the user wants to see/chart/graph/plot a trend, comparison, or split/breakdown, call render_chart after the data tool that has the numbers — never retype the numbers yourself. A question about how one muscle's volume splits across exercises (e.g. "what's my tricep split") is get_muscle_exercise_split rendered as a pie.`;

function getByPath(obj, path) {
  if (!path) return obj;
  return path.split('.').reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
}

/** Looks up a prior tool result by the tool's NAME, not its opaque call id.
 * Models reliably remember "I called get_exercise_trend" but don't reliably
 * transcribe an id like "call_f669b5eb..." verbatim — confirmed directly:
 * asked to reference call id "call_1", gpt-oss-120b invented "1" instead,
 * which would silently fail a strict-equality id lookup every time. Walking
 * backwards over the assistant's own tool_calls (which we generated, so the
 * id<->name mapping is authoritative) and matching on name sidesteps that
 * failure mode entirely — most-recent call to that tool wins if it was
 * called more than once this turn. */
function findToolResultByName(messages, toolName) {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m.role !== 'assistant' || !Array.isArray(m.tool_calls)) continue;
    for (const call of m.tool_calls) {
      if (call.function?.name !== toolName) continue;
      const resultMsg = messages.find((mm) => mm.role === 'tool' && mm.tool_call_id === call.id);
      if (resultMsg) return resultMsg;
    }
  }
  return null;
}

/** render_chart never touches the data tools or their numbers directly — it
 * reads the exact JSON a prior tool call in THIS turn already returned,
 * straight out of the running `messages` array. If the model had to retype
 * the numbers into this tool's own arguments instead, we'd reintroduce
 * exactly the transcription-hallucination risk tool-calling exists to
 * avoid in the first place. */
function buildVisualization(messages, args) {
  const { sourceTool, rowsPath, chartType, xKey, yKeys, title } = args ?? {};
  const toolMessage = findToolResultByName(messages, sourceTool);
  if (!toolMessage) {
    return { error: `No call to tool "${sourceTool}" found earlier in this turn. Call the data tool first, then reference its name here.` };
  }
  let data;
  try {
    data = JSON.parse(toolMessage.content);
  } catch {
    return { error: 'Could not parse the referenced tool result.' };
  }
  const rows = getByPath(data, rowsPath);
  if (!Array.isArray(rows)) {
    return { error: `rowsPath "${rowsPath || '(root)'}" did not resolve to an array in that tool's result.` };
  }
  if (rows.length === 0) {
    return { error: 'That data is empty — nothing to chart.' };
  }
  const wanted = [...new Set([xKey, ...(Array.isArray(yKeys) ? yKeys : [])])];
  const missing = wanted.filter((k) => !(k in rows[0]));
  if (missing.length > 0) {
    return { error: `These fields aren't on the referenced rows: ${missing.join(', ')}. Available: ${Object.keys(rows[0]).join(', ')}` };
  }
  const trimmedRows = rows.slice(-90);
  return {
    visualization: { chartType, title, xKey, yKeys, rows: trimmedRows },
    toolResult: { status: 'rendered', title, rowCount: trimmedRows.length },
  };
}

class ProviderRateLimitError extends Error {}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function callProvider(messages) {
  const res = await fetch(`${COACH_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${COACH_API_KEY}` },
    body: JSON.stringify({
      model: COACH_MODEL,
      messages,
      tools: TOOL_SCHEMAS,
      tool_choice: 'auto',
      temperature: 0.4,
      // Reasoning models (Groq's gpt-oss, OpenCode's deepseek) burn hidden
      // "thinking" tokens before answering by default — seen: 1690
      // completion tokens for one plain question with no tools involved.
      // These two fields are the fix on providers that support them; a
      // provider that doesn't recognize them (confirmed against OpenCode)
      // just ignores them rather than erroring.
      reasoning_effort: 'low',
      include_reasoning: false,
      // The single biggest lever against blowing a rate/token budget on
      // the final round of a multi-round turn. Plenty for a coaching answer.
      max_completion_tokens: 900,
    }),
  });
  if (res.status === 429) throw new ProviderRateLimitError();
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`AI Coach provider error ${res.status}: ${text.slice(0, 300)}`);
  }
  return res.json();
}

/** Runs the tool-calling loop to completion and returns the final assistant
 * text. `history` is the prior conversation (user/assistant turns only —
 * no system message, that's added here). Works against any OpenAI-
 * compatible chat-completions API — see config.js for provider selection. */
export async function runCoachAgent(history) {
  if (!COACH_API_KEY) throw new Error('COACH_API_KEY is not configured on the server.');

  const messages = [{ role: 'system', content: SYSTEM_PROMPT }, ...history];
  let lastVisualization = null;

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    // A multi-round tool-calling turn re-sends the whole growing context on
    // every round, which can burn through a free-tier rate limit fast. One
    // short retry covers the common case (the window resets in a couple
    // seconds); a second miss surfaces a real, actionable message instead
    // of a raw provider error.
    let data;
    try {
      data = await callProvider(messages);
    } catch (e) {
      if (!(e instanceof ProviderRateLimitError)) throw e;
      await sleep(2500);
      try {
        data = await callProvider(messages);
      } catch (e2) {
        if (e2 instanceof ProviderRateLimitError) {
          throw new Error("The AI Coach provider's rate limit was hit — wait a moment and try again, or ask a narrower question.");
        }
        throw e2;
      }
    }
    const message = data.choices[0].message;
    // Only push what the next round actually needs — a stray `reasoning`
    // field would otherwise get resent (and re-billed) on every subsequent
    // round of this same loop.
    messages.push({ role: message.role, content: message.content, tool_calls: message.tool_calls });

    const toolCalls = message.tool_calls;
    if (!toolCalls || toolCalls.length === 0) {
      return { content: message.content ?? '', visualization: lastVisualization };
    }

    for (const call of toolCalls) {
      let args;
      try {
        args = call.function.arguments ? JSON.parse(call.function.arguments) : {};
      } catch (e) {
        messages.push({ role: 'tool', tool_call_id: call.id, content: JSON.stringify({ error: String(e?.message ?? e) }) });
        continue;
      }

      if (call.function.name === 'render_chart') {
        let built;
        try {
          built = buildVisualization(messages, args);
        } catch (e) {
          built = { error: String(e?.message ?? e) };
        }
        if (built.error) {
          messages.push({ role: 'tool', tool_call_id: call.id, content: JSON.stringify({ error: built.error }) });
        } else {
          lastVisualization = built.visualization;
          messages.push({ role: 'tool', tool_call_id: call.id, content: JSON.stringify(built.toolResult) });
        }
        continue;
      }

      const fn = TOOLS[call.function.name];
      let result;
      try {
        result = fn ? fn(args) : { error: `Unknown tool "${call.function.name}"` };
      } catch (e) {
        result = { error: String(e?.message ?? e) };
      }
      messages.push({ role: 'tool', tool_call_id: call.id, content: JSON.stringify(result) });
    }
  }

  return { content: "I wasn't able to finish looking that up — try asking again, maybe with a narrower question.", visualization: lastVisualization };
}
