/* One FAQ, two interfaces.

   'Before You Ask' on the homepage and The Kingdom Concierge both read this
   file and nothing else, so a question or an answer edited here changes in
   both places at once. They were previously two separate sets of words — the
   Concierge carried its own paraphrased knowledge base — which is exactly how
   the two drift apart and start contradicting each other. */
export type FaqEntry = { q: string; a: string[] };

// The questions as they are asked on the page, in the order they are asked.
export const FAQ: FaqEntry[] = [
  {
    q: "Do you offer both natural and lab-grown diamonds?",
    a: [
      "Absolutely. The choice is entirely yours.",
      "Natural and lab-grown diamonds are chemically, physically, and optically identical. The only differences are origin, price, and resale potential.",
      "Our role is to educate, design, and craft. If you'd like guidance choosing, we're here to help.",
    ],
  },
  {
    q: "Do I need to know exactly what I want?",
    a: [
      "Not at all.",
      "Some clients arrive with a clear vision, others simply know they want something meaningful. Whether you have a complete design, a rough idea, or no idea at all, we'll help shape it into something powerfully personal and unmistakably yours.",
    ],
  },
  {
    q: "Can I repurpose or trade in my existing jewelry?",
    a: [
      "Absolutely.",
      "A family heirloom, an existing diamond, or gold you already own — we can often repurpose it into a new creation or offer a trade-in value toward your bespoke piece.",
      "Giving new life to something meaningful is one of our favorite parts of what we do.",
    ],
  },
  {
    q: "Will I see the design before it's in production?",
    a: [
      "Absolutely.",
      "Before production begins, you'll receive a detailed CAD rendering, along with the product dimensions, total carat weight, metal type, and key specifications for your approval.",
      "Nothing moves into production until we've got your confirmation.",
    ],
  },
  {
    q: "Is there a minimum budget for going custom?",
    a: [
      "No.",
      "Every piece is unique, and the cost is shaped entirely by your preferences — design, materials, and required craftsmanship.",
      "That flexibility is one of the greatest advantages of going custom. Tell us your vision and ideal budget. From there, we'll recommend the best design for you.",
    ],
  },
  {
    q: "How does payment work on custom?",
    a: [
      "For custom projects, we typically take a deposit.",
      "Every creation is unique, so the deposit amount is tailored to the project itself. The remaining balance is due once your piece is complete and ready for collection or shipment.",
      "If you have a preferred payment arrangement, let us know. We'll always do our best to accommodate.",
    ],
  },
  {
    q: "How long does a custom project take?",
    a: [
      "Most creations are completed within 3–6 weeks, depending on complexity.",
      "If you're working toward a proposal, anniversary, birthday, or another important date, let us know. We'll do everything we can to meet your timeline, and rush orders are often possible.",
    ],
  },
  {
    q: "What if I want to make a change?",
    a: [
      "We'll always do our very best to accommodate.",
      "Whether your piece is in production or already complete, we'll gladly make changes wherever possible. If additional materials or craftsmanship are required, we'll discuss your options and any associated costs with you beforehand.",
      "As every piece is handcrafted exclusively for its owner, custom commissions are generally non-refundable. That said, every situation is unique, and we'll always work with you to ensure you're exceptionally pleased with both your piece and your experience.",
    ],
  },
  {
    q: "Do you ship worldwide?",
    a: [
      "Yes. Complimentary worldwide shipping is included with every order.",
      "Every piece is fully insured in transit, discreetly packaged, and delivered safely to your door.",
    ],
  },
  {
    q: "How do I get started?",
    a: ["Reach out. We'd love to hear from you."],
  },
];

