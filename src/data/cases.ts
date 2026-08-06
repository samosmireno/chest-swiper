import type { SummitCase } from "../types";

const BREAKOUT = [
  "Break into small groups at your table (2–3).",
  "Answer on a single iPad in small groups.",
  "Answer the follow-up case questions as a table.",
];

export const cases: SummitCase[] = [
  {
    id: "case1",
    patientName: "Emma",
    intro: {
      narrative: [
        "Emma is an 11-year-old girl brought to clinic by her mother for a routine well-child visit before starting middle school. She is healthy, active in soccer, and has no significant past medical history.",
        "During the visit, her mother mentions that Emma's older brother was diagnosed with T1D at age 13 after presenting to the ED in DKA.",
        "Emma currently feels well and denies any symptoms.",
      ],
      breakout: BREAKOUT,
      image: "./patients/emma.webp",
      ageSex: "11-year-old girl",
    },
    questions: [
      {
        id: "c1q1",
        prompt: "Should she be tested for type 1 diabetes now?",
        context: [
          "11-year-old girl presenting for a routine well-child visit before starting middle school",
          "Family history of T1D (older brother)",
          "Currently feels well and denies any symptoms of diabetes.",
        ],
        options: [
          { id: "yes", label: "Yes" },
          { id: "no", label: "No" },
        ],
        correctOptionId: "yes",
      },
      {
        id: "c1q2",
        prompt: "How would you test Emma for diabetes?",
        options: [
          { id: "fpg", label: "Fasting glucose" },
          { id: "a1c", label: "HbA1c" },
          { id: "aab", label: "Islet autoantibodies" },
        ],
        correctOptionId: "aab",
      },
      {
        id: "c1q3",
        prompt: "What is the most likely interpretation of Emma's results?",
        context: [
          "Emma undergoes screening through a T1D screening program",
          "Autoantibody results: GAD-65 (+), IA-2 (+), Insulin (−), ZnT8 (−)",
          "Glycemic parameters: Fasting glucose = 92 mg/dL, HbA1c = 5.3%",
        ],
        options: [
          { id: "none", label: "No evidence of T1D" },
          { id: "s1", label: "Stage 1 T1D" },
          { id: "s2", label: "Stage 2 T1D" },
          { id: "s3", label: "Stage 3 T1D" },
        ],
        correctOptionId: "s1",
      },
    ],
    discussion: {
      context: [
        "Emma undergoes repeat testing",
        "2-hr OGTT = 145 mg/dL, HbA1c 5.8%",
        "She remains asymptomatic",
      ],
      prompts: [
        "How would you counsel her family about the meaning of these results?",
        "How should the management evolve now based on these results?",
      ],
    },
  },
  {
    id: "case2",
    patientName: "James",
    intro: {
      narrative: [
        "34-year-old elementary school teacher.",
        "Mother was diagnosed with T1D in her 40s (initially diagnosed as T2D). After her diagnosis was clarified, James enrolled in TrialNet 2 years ago.",
        "Initial screening results (from 2 years ago): GAD-65 (+), IA-2, IAA & ZnT8 (−).",
        "BMI: 24 kg/m². Exam otherwise unremarkable.",
      ],
      breakout: BREAKOUT,
      image: "./patients/james.webp",
      ageSex: "34-year-old male",
    },
    questions: [
      {
        id: "c2q1",
        prompt: "What best describes James' status?",
        context: [
          "Repeat screening: GAD-65 & ZnT8 positive (2 autoantibodies).",
          "Current labs: Fasting glucose 91 mg/dL, A1C = 5.3%, OGTT 2-hr = 123 mg/dL",
          "Symptoms: None",
        ],
        options: [
          { id: "pre", label: "Pre-T1D" },
          { id: "s1", label: "Stage 1 T1D" },
          { id: "s2", label: "Stage 2 T1D" },
          { id: "s3", label: "Stage 3 T1D" },
        ],
        correctOptionId: "s1",
      },
      {
        id: "c2q2",
        prompt: "What would your treatment recommendation be now?",
        context: [
          "Repeat screening: GAD-65 & ZnT8 positive (2 autoantibodies).",
          "Current labs: Fasting glucose 91 mg/dL, A1C = 5.3%, OGTT 2-hr = 123 mg/dL",
          "Symptoms: None",
        ],
        options: [
          {
            id: "monitor",
            label: "Structured monitoring for signs and symptoms of diabetes",
          },
          {
            id: "insulin",
            label: "Start basal insulin to preserve beta cell function",
          },
          { id: "teplizumab", label: "Refer for teplizumab now" },
        ],
        correctOptionId: "monitor",
      },
      {
        id: "c2q3",
        prompt: "What best describes James' status now?",
        context: [
          "Repeat antibodies confirm GAD65 and ZnT8A.",
          "Current labs: Fasting glucose 108 mg/dL; HbA1C 5.9%; 2-hr OGTT 174 mg/dL",
          "Symptoms: increased fatigue but no other symptoms reported",
        ],
        options: [
          { id: "s1", label: "Stage 1 T1D" },
          { id: "s2", label: "Stage 2 T1D" },
          { id: "s3", label: "Stage 3 T1D" },
          { id: "s4", label: "Stage 4 T1D" },
        ],
        correctOptionId: "s2",
      },
    ],
    discussion: {
      context: [
        "Repeat antibodies confirm GAD65 and ZnT8A.",
        "Current labs: Fasting glucose 108 mg/dL; HbA1C 5.9%; 2-hr OGTT 174 mg/dL",
        "Symptoms: increased fatigue but no other symptoms reported",
      ],
      prompts: [
        "How would you counsel James about the meaning of these results?",
        "How should the management evolve now based on these results?",
      ],
    },
  },
];
