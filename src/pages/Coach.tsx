import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Send, Sparkles } from 'lucide-react';
import { sendCoachMessage, type CoachMessage } from '@/db/coach';

const SUGGESTIONS = [
  'Why has my bench press plateaued?',
  'What muscle groups have I been neglecting?',
  'Am I eating enough protein for my training?',
  'How has my body weight trended lately?',
];

export function Coach() {
  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, sending]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || sending) return;
    const next = [...messages, { role: 'user' as const, content }];
    setMessages(next);
    setInput('');
    setError(null);
    setSending(true);
    try {
      const reply = await sendCoachMessage(next);
      setMessages([...next, { role: 'assistant', content: reply }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'The coach could not respond. Try again.');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-9rem)] md:h-[calc(100dvh-6rem)] max-w-2xl mx-auto">
      <div className="mb-4">
        <h1 className="font-display text-3xl sm:text-4xl text-ink-900">AI Coach</h1>
        <p className="text-sm text-ink-500 mt-1">Answers grounded in your actual logs — not guesses.</p>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto">
      <div className="min-h-full flex flex-col justify-end space-y-4 pb-4">
        {messages.length === 0 && (
          <div className="space-y-3">
            <p className="text-sm text-ink-500">Ask something about your training, nutrition, or progress.</p>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-ink-900/25 text-ink-700 hover:border-gold-600 hover:text-gold-700 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.role === 'user' ? (
              <div className="max-w-[85%] rounded-lg bg-gold-600 text-paper-100 px-4 py-2.5 text-sm">{m.content}</div>
            ) : (
              <div className="max-w-[85%] rounded-lg bg-paper-100 border border-paper-400 px-4 py-3 text-sm text-ink-900 coach-markdown">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
              </div>
            )}
          </div>
        ))}

        {sending && (
          <div className="flex justify-start">
            <div className="rounded-lg bg-paper-100 border border-paper-400 px-4 py-3 text-sm text-ink-500 flex items-center gap-2">
              <Sparkles size={14} className="animate-pulse text-gold-600" /> Thinking…
            </div>
          </div>
        )}
      </div>
      </div>

      {error && (
        <div className="bg-gold-600/10 border border-gold-600/40 text-gold-700 text-sm px-4 py-2.5 rounded-lg mb-3">{error}</div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex items-center gap-2 pt-2 border-t hairline"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask your coach…"
          disabled={sending}
          className="flex-1 bg-transparent border-b border-ink-900/25 focus:border-gold-600 py-2 text-sm focus:outline-none placeholder:text-ink-300 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          aria-label="Send"
          className="text-ink-500 hover:text-gold-600 disabled:text-ink-300 p-2"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
