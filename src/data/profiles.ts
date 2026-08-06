import type { PatientProfile } from "../types";

export const profiles: PatientProfile[] = [
  {
    id: "c1",
    ageSex: "27-year-old female",
    image: "./patients/c1.webp",
    fields: [
      { label: "BMI", value: "31 kg/m²" },
      { label: "Labs", value: "FPG = 95 mg/dL, HbA1c = 4.9%" },
      {
        label: "History",
        value:
          "Hashimoto's (self), celiac disease (parent), type 2 diabetes (maternal grandfather)",
      },
    ],
    leftOption: "Monitor",
    rightOption: "Screen for T1D",
    correctSide: "right",
    topic: "screening",
    explanation:
      "Personal or family history of other autoimmune conditions (e.g. Hashimoto's and celiac disease) may warrant screening for T1D with islet autoantibodies.",
  },
  {
    id: "c2",
    ageSex: "9-year-old female",
    image: "./patients/c2.webp",
    fields: [
      { label: "Autoantibodies", value: "IA-2 positive (confirmed)" },
      { label: "Labs", value: "FPG = 94 mg/dL, HbA1c = 5.1%" },
      { label: "History", value: "family history of T1D" },
    ],
    leftOption: "Pre-T1D",
    rightOption: "Stage 1 T1D",
    correctSide: "left",
    topic: "staging",
    explanation:
      "The presence of 1 confirmed autoantibody and family history of T1D indicate that this patient is at higher risk of developing T1D. Because she doesn't have 2 or more confirmed islet autoantibodies, she is not yet in stage 1 T1D.",
  },
  {
    id: "c3",
    ageSex: "14-year-old male",
    image: "./patients/c3.webp",
    fields: [
      { label: "Autoantibodies", value: "ZnT8 & GAD-65 positive (confirmed)" },
      { label: "Labs", value: "2-h PG = 144 mg/dL" },
      { label: "Symptoms", value: "no symptoms of diabetes" },
    ],
    leftOption: "Stage 1 T1D",
    rightOption: "Stage 2 T1D",
    correctSide: "right",
    topic: "staging",
    explanation:
      "Based on the presence of 2 confirmed autoantibodies, dysglycemia on OGTT and no symptoms, this patient is likely in stage 2 T1D.",
  },
  {
    id: "c4",
    ageSex: "25-year-old male",
    image: "./patients/c4.webp",
    fields: [
      { label: "BMI", value: "24 kg/m²" },
      {
        label: "History",
        value: "Diagnosed with T2D 1 year ago, history of celiac disease",
      },
      {
        label: "Symptoms",
        value:
          "Unintentional weight loss, progressed to insulin treatment 7 months at diagnosis",
      },
      { label: "Labs", value: "A1c = 7.1%" },
    ],
    leftOption: "Intensify T2D treatment",
    rightOption: "Screen for T1D",
    correctSide: "right",
    topic: "screening",
    explanation:
      "Given some phenotypical risk factors that may overlap with those of T1D (younger age, normal BMI, faster progression to insulin treatment), it is plausible that this patient may have been misdiagnosed with T2D and may have T1D instead.",
  },
  {
    id: "c5",
    ageSex: "12-year-old female",
    image: "./patients/c5.webp",
    fields: [
      { label: "Autoantibodies", value: "IA-2 & GAD-65 positive (confirmed)" },
      { label: "Labs", value: "2-h PG = 156 mg/dL, HbA1c = 5.8%" },
    ],
    leftOption: "Stage 1 or Stage 2 T1D",
    rightOption: "Stage 3 T1D",
    correctSide: "left",
    topic: "staging",
    explanation:
      "Based on the presence of 2 confirmed autoantibodies and dysglycemia, this patient can be in either stage 1 or stage 2 T1D depending on symptom status.",
  },
  {
    id: "c6",
    ageSex: "43-year-old female",
    image: "./patients/c6.webp",
    fields: [
      { label: "BMI", value: "29 kg/m²" },
      { label: "Autoantibodies", value: "GAD-65 positive (confirmed)" },
      { label: "Labs", value: "FPG = 148 mg/dL" },
      { label: "Symptoms", value: "fatigue, increased thirst and urination" },
    ],
    leftOption: "Stage 1 or Stage 2 T1D",
    rightOption: "Stage 3 T1D",
    correctSide: "right",
    topic: "staging",
    explanation:
      "Based on values for overt hyperglycemia and symptom status, this patient is likely in stage 3 T1D, despite having 1 confirmed autoantibody, which in adults with T1D may become absent.",
  },
  {
    id: "c7",
    ageSex: "19-year-old male",
    image: "./patients/c7.webp",
    fields: [
      {
        label: "Autoantibodies",
        value: "IAA, IA-2, ZnT8 & GAD-65 positive (confirmed)",
      },
      { label: "Labs", value: "2-h PG = 126 mg/dL" },
      { label: "Symptoms", value: "no symptoms of diabetes" },
    ],
    leftOption: "Stage 1 T1D",
    rightOption: "Stage 2 T1D",
    correctSide: "left",
    topic: "staging",
    explanation:
      "This patient has 4 confirmed islet autoantibodies, with normoglycemia and no symptoms, and hence, is likely to be in stage 1 T1D.",
  },
  {
    id: "c8",
    ageSex: "11-year-old female",
    image: "./patients/c8.webp",
    fields: [
      { label: "Autoantibodies", value: "IAA & IA-2 positive (confirmed)" },
      { label: "Labs", value: "FPG = 110 mg/dL" },
      { label: "Symptoms", value: "no symptoms of diabetes" },
    ],
    leftOption: "Monitor",
    rightOption: "Consider teplizumab",
    correctSide: "right",
    topic: "teplizumab",
    explanation:
      "This patient is likely to be in stage 2 T1D based on the presence of 2 islet autoantibodies, dysglycemia, and no symptoms of diabetes, and may warrant treatment with teplizumab to delay progression to stage 3 T1D.",
  },
  {
    id: "c9",
    ageSex: "7-year-old male",
    image: "./patients/c9.webp",
    fields: [
      {
        label: "Autoantibodies",
        value: "IA-2, ZnT8 & GAD-65 positive (confirmed)",
      },
      { label: "Labs", value: "2-h PG = 212 mg/dL" },
      { label: "Symptoms", value: "fatigue and recent weight loss" },
    ],
    leftOption: "Start insulin",
    rightOption: "Start teplizumab",
    correctSide: "left",
    topic: "teplizumab",
    explanation:
      "This patient is likely in stage 3 T1D, and insulin initiation may be necessary.",
  },
  {
    id: "c10",
    ageSex: "20-year-old female",
    image: "./patients/c10.webp",
    fields: [
      { label: "Autoantibodies", value: "IAA & GAD-65 positive (confirmed)" },
      { label: "Labs", value: "FPG = 85 mg/dL, HbA1c = 5.2%" },
      { label: "Symptoms", value: "no symptoms of diabetes" },
      {
        label: "History",
        value: "no family history of T1D or other autoimmune conditions",
      },
    ],
    leftOption: "50% lifetime risk of clinical T1D",
    rightOption: "100% lifetime risk of clinical T1D",
    correctSide: "right",
    topic: "staging",
    explanation:
      "Based on the presence of 2 confirmed islet autoantibodies, this patient has a nearly 100% lifetime risk of developing clinical (stage 3) T1D, regardless of normoglycemia, current symptom status, or lack of family history of T1D or other autoimmune conditions.",
  },
  {
    id: "c11",
    ageSex: "5-year-old male",
    image: "./patients/c11.webp",
    fields: [
      {
        label: "Autoantibodies",
        value: "Tested negative for all 4 autoantibodies (confirmed)",
      },
      { label: "Labs", value: "FPG = 79 mg/dL, HbA1c = 5.1%" },
      { label: "Symptoms", value: "no symptoms of diabetes" },
      { label: "History", value: "family history of T1D" },
    ],
    leftOption: "Rescreen in 1 year",
    rightOption: "Rescreen around 9 years of age",
    correctSide: "left",
    topic: "screening",
    explanation:
      "Given the increased risk of developing T1D due to family history, as well as younger age, rescreening in 1 year with islet autoantibodies is recommended in this patient.",
  },
  {
    id: "c12",
    ageSex: "17-year-old female",
    image: "./patients/c12.webp",
    fields: [
      {
        label: "Treatment",
        value:
          "Confirmed stage 2 T1D and currently on day 3 of teplizumab infusions",
      },
      {
        label: "Monitoring",
        value:
          "all labs normal, no infection concerns, but observed decreased lymphocyte count (ALC of 510/µL, down from 1,900/µL at baseline)",
      },
    ],
    leftOption: "Permanently discontinue teplizumab",
    rightOption: "Continue teplizumab with monitoring",
    correctSide: "right",
    topic: "monitoring",
    explanation:
      "Since lymphopenia is usually transient with teplizumab, it is recommended to continue the infusion protocol and monitor ALC levels. However, if ALC levels are <500 cells/µL for 1 week or longer, permanent discontinuation is recommended.",
  },
  {
    id: "c13",
    ageSex: "26-year-old female",
    image: "./patients/c13.webp",
    fields: [
      {
        label: "Treatment",
        value:
          "Confirmed stage 2 T1D and currently on day 12 of teplizumab infusions",
      },
      {
        label: "Monitoring",
        value:
          "new fever, worsening fatigue, EBV PCR: high-level viremia (from negative at baseline)",
      },
    ],
    leftOption: "Permanently discontinue teplizumab",
    rightOption: "Continue teplizumab with monitoring",
    correctSide: "left",
    topic: "monitoring",
    explanation:
      "Given the laboratory evidence of potential EBV reactivation or infection, treatment with teplizumab should be discontinued.",
  },
  {
    id: "c14",
    ageSex: "8-year-old female",
    image: "./patients/c14.webp",
    fields: [
      {
        label: "Symptoms",
        value:
          "2-week history of mild fatigue, polyuria and some unintentional weight loss",
      },
      {
        label: "Autoantibodies",
        value: "GAD-65 & IA-2 positive (confirmed)",
      },
      {
        label: "Labs",
        value:
          "2-hr OGTT = 285 mg/dL, HbA1c = 7.9%, C-peptide = 0.4 pmol/mL (mixed-meal tolerance test)",
      },
    ],
    leftOption: "Start Insulin Injections",
    rightOption: "Start Insulin Injections + Teplizumab",
    correctSide: "right",
    topic: "teplizumab",
    explanation:
      "Based on laboratory values and symptoms, this patient has stage 3 T1D. In addition to starting insulin injections, after the patient’s symptoms and glycemic parameters have stabilized, this patient may also be an appropriate candidate for teplizumab treatment to delay the decline in endogenous insulin production.",
  },
  {
    id: "c15",
    ageSex: "10-year-old male",
    image: "./patients/c15.webp",
    fields: [
      {
        label: "History",
        value:
          "Diagnosed with stage 3 T1D 3 weeks ago and started on basal-bolus insulin injections",
      },
      {
        label: "Follow-up",
        value:
          "Family inquires about any potential treatment option in addition to insulin and have inquired about teplizumab. What should you counsel this family about expectations and time commitments with teplizumab infusions?",
      },
    ],
    leftOption:
      "2 infusion courses (12 consecutive days each), within 6 months of each other",
    rightOption: "One-time infusion course for 14-consecutive days",
    longOptions: true,
    correctSide: "left",
    topic: "teplizumab",
    explanation:
      "In the setting of newly-diagnosed stage 3 T1D, teplizumab is administered as 2 separate infusion courses (each being 12 consecutive days), spaced within 6 months of each other. This differs from teplizumab for delaying progression to stage 3 (in individuals with stage 2), which is a one-time infusion course of 14 consecutive days.",
  },
];
