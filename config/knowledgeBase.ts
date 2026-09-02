// FAQ entries the agent (phase 4+) can ground its answers on. Edit freely —
// each entry is just a topic tag plus the answer text. Keep answers short;
// this is WhatsApp, not a help center.
//
// Anything not covered here or in hotel.ts should NOT be answered from the
// model's general knowledge — escalate to the front desk instead.

export interface KnowledgeBaseEntry {
  topic: string;
  question: string;
  answer: string;
}

export const knowledgeBase: KnowledgeBaseEntry[] = [
  {
    topic: "check-in-out",
    question: "What time is check-in and check-out?",
    answer: "Placeholder: e.g. 'Check-in is from 15:00, check-out is until 11:00.'",
  },
  {
    topic: "amenities",
    question: "What amenities does the hotel have?",
    answer: "Placeholder: e.g. 'Pool, gym, rooftop restaurant, and 24h front desk.'",
  },
  {
    topic: "parking",
    question: "Is parking available?",
    answer: "Placeholder: see config/hotel.ts `parking` field.",
  },
  {
    topic: "pets",
    question: "Are pets allowed?",
    answer: "Placeholder: see config/hotel.ts `petPolicy` field.",
  },
  {
    topic: "wifi",
    question: "Is wifi available?",
    answer: "Placeholder: see config/hotel.ts `wifi` field.",
  },
  {
    topic: "breakfast",
    question: "What are breakfast hours?",
    answer: "Placeholder: see config/hotel.ts `breakfastHours` field.",
  },
  {
    topic: "airport-distance",
    question: "How far is the hotel from the airport?",
    answer: "Placeholder: see config/hotel.ts `airportDistanceNote` field.",
  },
  {
    topic: "cancellation-policy",
    question: "What is the cancellation policy?",
    answer: "Placeholder: see config/hotel.ts `cancellationPolicy` field.",
  },
];
