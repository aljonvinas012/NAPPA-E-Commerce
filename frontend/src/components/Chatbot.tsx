import { useEffect, useRef, useState } from 'react';

interface ChatMessage {
  from: 'bot' | 'user';
  text: string;
}

const WELCOME = "Hi! I'm the Nappa Assistant 🌿 Ask me about shipping, payment options, order tracking, or returns — I'm happy to help!";

// Quick-question buttons shown under the welcome message. Clicking one
// behaves just like the customer typed the question themselves — it's
// echoed as their message, then auto-answered by getAutoReply below.
const QUICK_QUESTIONS = [
  'How long does shipping take?',
  'What payment methods do you accept?',
  'How do I track my order?',
  'Can I cancel my order?',
  'What if my item arrives damaged?',
  'How can I contact you?',
];

// Small rule-based auto-responder. No backend call needed — it just matches
// keywords in what the customer types and replies instantly, so there's
// always someone "answering" in the corner of the screen.
const getAutoReply = (message: string): string => {
  const m = message.toLowerCase();

  if (/(ship|deliver|courier|how long|kailan)/.test(m)) {
    return 'We deliver nationwide via our Nappa Delivery Team, usually within 3–7 business days depending on your location. You can track your order anytime under "Track Your Order" in your account.';
  }
  if (/(pay|gcash|maya|cod|cash on delivery|card)/.test(m)) {
    return 'We accept Cash on Delivery, GCash, Maya, and Card payments. You can pick your preferred method at checkout.';
  }
  if (/(cancel)/.test(m)) {
    return 'You can cancel an order from your Order Details page, but only while it\'s still "Preparing" — once it\'s shipped out, cancellation is no longer possible.';
  }
  if (/(return|refund|damage|defect)/.test(m)) {
    return 'If an item arrives damaged or incorrect, please contact us at nappafoodcrafts@gmail.com or 0917-770-8925 within 3 days of delivery so we can help sort out a refund or replacement.';
  }
  if (/(track|order status|where.*order)/.test(m)) {
    return 'You can track any order in progress under "Track Your Order" in your account — every order gets its own live status.';
  }
  if (/(contact|number|email|address|location)/.test(m)) {
    return 'You can reach us at 0917-770-8925 or nappafoodcrafts@gmail.com. We\'re located at Phase 2 Sumlang Lake, Brgy. Sumlang, Camalig, Albay.';
  }
  if (/(hi|hello|kumusta|hey)/.test(m)) {
    return 'Hello there! 👋 How can I help you today?';
  }
  if (/(thank|salamat)/.test(m)) {
    return 'You\'re very welcome! Happy shopping at Nappa Food & Crafts! 🌿';
  }
  return "Thanks for your message! For anything I can't answer, please reach our team directly at 0917-770-8925 or nappafoodcrafts@gmail.com and we'll get back to you shortly.";
};

const Chatbot = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([{ from: 'bot', text: WELCOME }]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing, open]);

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    setInput('');
    sendMessage(text);
  };

  // Shared by both the text form and the quick-question buttons — pushes
  // the message as if the user typed it, then auto-answers it.
  const sendMessage = (text: string) => {
    setMessages((prev) => [...prev, { from: 'user', text }]);
    setTyping(true);
    setTimeout(() => {
      setMessages((prev) => [...prev, { from: 'bot', text: getAutoReply(text) }]);
      setTyping(false);
    }, 600);
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end">
      {open && (
        <div className="mb-3 w-[90vw] max-w-sm bg-paper rounded-card shadow-card border border-tan/30 flex flex-col overflow-hidden animate-pop-in" style={{ height: 440 }}>
          <div className="bg-bark text-paper px-4 py-3 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-paper/15 flex items-center justify-center text-sm">
              <i className="fas fa-leaf" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold leading-tight">Nappa Assistant</p>
              <p className="text-[11px] text-paper/60 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Online</p>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close chat" className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-paper/10">
              <i className="fas fa-xmark" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5 bg-cream/40">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] text-sm px-3.5 py-2 rounded-2xl leading-relaxed ${
                    msg.from === 'user' ? 'bg-oliveDark text-paper rounded-br-sm' : 'bg-paper border border-tan/30 text-ink rounded-bl-sm'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {typing && (
              <div className="flex justify-start">
                <div className="bg-paper border border-tan/30 text-bark/50 text-sm px-3.5 py-2 rounded-2xl rounded-bl-sm">
                  <i className="fas fa-ellipsis animate-pulse" />
                </div>
              </div>
            )}
            {/* Quick-question buttons — tap one and it auto-answers, no typing needed */}
            {!typing && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {QUICK_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    className="text-xs font-medium px-3 py-1.5 rounded-full border border-oliveDark/40 text-oliveDark bg-paper hover:bg-olive/10 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <form onSubmit={send} className="p-2.5 border-t border-tan/20 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              className="input-field !py-2 text-sm flex-1"
            />
            <button type="submit" className="btn-primary !py-2 !px-3.5 shrink-0" aria-label="Send message">
              <i className="fas fa-paper-plane" />
            </button>
          </form>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Chat with us"
        className="w-14 h-14 rounded-full bg-oliveDark text-paper shadow-card flex items-center justify-center text-xl hover:scale-105 transition-transform"
      >
        <i className={`fas ${open ? 'fa-xmark' : 'fa-comment-dots'}`} />
      </button>
    </div>
  );
};

export default Chatbot;
