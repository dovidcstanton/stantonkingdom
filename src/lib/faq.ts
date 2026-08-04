/* One FAQ, two interfaces.

   'Before You Ask' on the homepage and The Kingdom Concierge both read this
   file and nothing else, so a question or an answer edited here changes in
   both places at once. They were previously two separate sets of words — the
   Concierge carried its own paraphrased knowledge base — which is exactly how
   the two drift apart and start contradicting each other. */
/** `id` is the question's permanent name, and it is deliberately not its
 *  position in this array and not a slug of its wording.
 *
 *  Both of those change for reasons that have nothing to do with the question:
 *  reordering the list, or rewording "How long does a custom project take?" to
 *  "How long will my piece take?", would silently break every link anyone had
 *  ever shared. The id is a short hand-written noun, chosen once, and it is
 *  what `/#faq-timeline` means — so the search result, the deep link and the
 *  expanded answer all agree however the ten questions are edited afterwards.
 *
 *  `aliases` is the vocabulary a visitor arrives with, which is often not the
 *  vocabulary the question is written in — nobody types "custom project take",
 *  they type "how many weeks" or "turnaround". It is matched by search and
 *  never displayed, so the question on the page stays the sentence the house
 *  wants to be read and the matching stays as wide as it needs to be. */
export type FaqEntry = { id: string; q: string; a: string[]; aliases?: string[] };

// The questions as they are asked on the page, in the order they are asked.
export const FAQ: FaqEntry[] = [
  {
    id: "diamonds",
    aliases: [
      "natural", "lab grown", "labgrown", "lab-grown", "man made", "synthetic",
      "cultured", "mined", "earth grown", "stone", "gemstone", "difference",
      "real diamond", "diamon", "diamonds",
    ],
    q: "Do you offer both natural and lab-grown diamonds?",
    a: [
      "Absolutely. The choice is entirely yours.",
      "Natural and lab-grown diamonds are chemically, physically, and optically identical. The only differences are origin, price, and resale potential.",
      "Our role is to educate, design, and craft. If you'd like guidance choosing, we're here to help.",
    ],
  },
  {
    id: "unsure",
    aliases: ["dont know", "do not know", "no idea", "idea", "vision", "unsure", "not sure", "where to start", "help me decide", "inspiration", "guidance", "undecided"],
    q: "Do I need to know exactly what I want?",
    a: [
      "Not at all.",
      "Some clients arrive with a clear vision, others simply know they want something meaningful. Whether you have a complete design, a rough idea, or no idea at all, we'll help shape it into something powerfully personal and unmistakably yours.",
    ],
  },
  {
    id: "repurpose",
    aliases: ["heirloom", "trade in", "tradein", "trade-in", "existing", "reset", "resetting", "old ring", "inherited", "upgrade", "recycle", "reuse", "remount", "family stone", "my own diamond"],
    q: "Can I repurpose or trade in my existing jewelry?",
    a: [
      "Absolutely.",
      "A family heirloom, an existing diamond, or gold you already own — we can often repurpose it into a new creation or offer a trade-in value toward your bespoke piece.",
      "Giving new life to something meaningful is one of our favorite parts of what we do.",
    ],
  },
  {
    id: "cad",
    aliases: ["cad", "rendering", "render", "3d", "preview", "proof", "mock up", "mockup", "approve", "approval", "see the design", "before production", "drawing", "sketch"],
    q: "Will I see the design before it's in production?",
    a: [
      "Absolutely.",
      "Before production begins, you'll receive a detailed CAD rendering, along with the product dimensions, total carat weight, metal type, and key specifications for your approval.",
      "Nothing moves into production until we've got your confirmation.",
    ],
  },
  {
    id: "budget",
    aliases: ["minimum", "budget", "cost", "price", "pricing", "how much", "afford", "expensive", "cheap", "spend", "starting price", "entry price"],
    q: "Is there a minimum budget for going custom?",
    a: [
      "No.",
      "Every piece is unique, and the cost is shaped entirely by your preferences — design, materials, and required craftsmanship.",
      "That flexibility is one of the greatest advantages of going custom. Tell us your vision and ideal budget. From there, we'll recommend the best design for you.",
    ],
  },
  {
    id: "payment",
    aliases: ["payment", "pay", "deposit", "instalment", "installment", "financing", "finance", "balance", "invoice", "card", "wire", "split payment"],
    q: "How does payment work on custom?",
    a: [
      "For custom projects, we typically take a deposit.",
      "Every creation is unique, so the deposit amount is tailored to the project itself. The remaining balance is due once your piece is complete and ready for collection or shipment.",
      "If you have a preferred payment arrangement, let us know. We'll always do our best to accommodate.",
    ],
  },
  {
    id: "timeline",
    aliases: ["how long", "timeline", "turnaround", "turn around", "how many weeks", "weeks", "lead time", "when will it arrive", "delivery time", "how quickly", "rush", "deadline", "fast", "speed", "time frame", "timeframe", "eta"],
    q: "How long does a custom project take?",
    a: [
      "Most creations are completed within 3–6 weeks, depending on complexity.",
      "If you're working toward a proposal, anniversary, birthday, or another important date, let us know. We'll do everything we can to meet your timeline, and rush orders are often possible.",
    ],
  },
  {
    id: "changes",
    aliases: ["change", "amend", "alter", "modify", "adjust", "revise", "refund", "return", "cancel", "exchange", "changed my mind", "not happy", "resize"],
    q: "What if I want to make a change?",
    a: [
      "We'll always do our very best to accommodate.",
      "Whether your piece is in production or already complete, we'll gladly make changes wherever possible. If additional materials or craftsmanship are required, we'll discuss your options and any associated costs with you beforehand.",
      "As every piece is handcrafted exclusively for its owner, custom commissions are generally non-refundable. That said, every situation is unique, and we'll always work with you to ensure you're exceptionally pleased with both your piece and your experience.",
    ],
  },
  {
    id: "shipping",
    aliases: ["ship", "shipping", "delivery", "deliver", "worldwide", "international", "overseas", "abroad", "insured", "insurance", "postage", "courier", "tracking", "customs", "duties"],
    q: "Do you ship worldwide?",
    a: [
      "Yes. Complimentary worldwide shipping is included with every order.",
      "Every piece is fully insured in transit, discreetly packaged, and delivered safely to your door.",
    ],
  },
  {
    id: "start",
    aliases: ["get started", "begin", "first step", "contact", "reach out", "book", "enquire", "inquire", "appointment", "consultation", "talk to someone", "speak"],
    q: "How do I get started?",
    a: ["Reach out. We'd love to hear from you."],
  },
];

