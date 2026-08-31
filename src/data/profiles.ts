import type { PatientProfile } from "../types";

// 12 cases from documents/cases.pptx: 6 severe asthma (biologic selection)
// followed by 6 COPD (GOLD 2026 escalation). Field values keep the slides'
// abbreviations (FeNO, EOS, IgE, FEV1, CAAT) as printed on the cards.
export const profiles: PatientProfile[] = [
  {
    id: "c1",
    ageSex: "Khloe, 24-year-old female",
    image: "./patients/khloe.webp",
    fields: [
      {
        label: "History",
        value: "Diagnosed with asthma at age 20; eczema in childhood",
      },
      {
        label: "Treatment",
        value:
          "Budesonide/formoterol (160 mcg/4.5 mcg), tiotropium, and a rescue inhaler",
      },
      {
        label: "Recent",
        value: "ED visit 2 months ago due to shortness of breath",
      },
      { label: "Labs", value: "FeNO = 50 ppb, EOS = 389 cells/μL" },
    ],
    leftOption: "Add a biologic",
    rightOption: "Optimize current management",
    correctSide: "left",
    topic: "asthma",
    explanation:
      "Elevated blood eosinophil and FeNO levels, the recent ED visit, and poor control of symptoms despite high-dose maintenance treatment warrant shared decision-making about adding a biologic to treat Khloe's severe asthma.",
  },
  {
    id: "c2",
    ageSex: "Kevin, 7-year-old male",
    image: "./patients/kevin.webp",
    fields: [
      {
        label: "History",
        value: "Dog and peanut allergies; uses avoidance strategies",
      },
      { label: "Symptoms", value: "Frequently wakes at night coughing" },
      {
        label: "Treatment",
        value:
          "Budesonide/formoterol (80 mcg/4.5 mcg); albuterol 3–4 times/week; correct inhaler technique",
      },
      {
        label: "Labs",
        value: "FeNO = 35 ppb, EOS = 150 cells/μL, IgE = 300 IU/mL",
      },
    ],
    leftOption: "Omalizumab",
    rightOption: "Mepolizumab",
    correctSide: "left",
    topic: "asthma",
    explanation:
      "Given his atopic tendencies, food allergies, and under-controlled asthma despite adequate inhaler technique, omalizumab, which targets IgE, is the better choice over mepolizumab, which targets IL-5, as an add-on biologic.",
  },
  {
    id: "c3",
    ageSex: "Miles, 13-year-old male",
    image: "./patients/miles.webp",
    fields: [
      {
        label: "History",
        value: "Asthma since age 8; atopic dermatitis with frequent flares",
      },
      {
        label: "Symptoms",
        value:
          "Breathless during soccer practice; rescue inhaler 4–5 days/week",
      },
      {
        label: "Treatment",
        value: "Fluticasone/vilanterol (200 mcg/25 mcg) and albuterol rescue",
      },
      {
        label: "Labs",
        value: "FeNO = 38 ppb, EOS = 168 cells/μL, IgE = 5 IU/mL",
      },
    ],
    leftOption: "Omalizumab",
    rightOption: "Dupilumab",
    correctSide: "right",
    topic: "asthma",
    explanation:
      "Elevated FeNO and EOS levels, along with worsening symptoms despite treatment, suggest poorly controlled severe asthma with ongoing type 2 inflammation. His history of atopic dermatitis makes dupilumab an attractive choice over omalizumab as an add-on biologic, as dupilumab is indicated to treat atopic dermatitis and asthma.",
  },
  {
    id: "c4",
    ageSex: "Claire, 47-year-old female",
    image: "./patients/claire.webp",
    fields: [
      {
        label: "History",
        value: "Asthma since age 32; former smoker, tobacco-free for 10 years",
      },
      {
        label: "Comorbidities",
        value: "Insulin-dependent diabetes, nasal polyps, seasonal allergies",
      },
      {
        label: "Treatment",
        value:
          "High-dose fluticasone/salmeterol; 1 exacerbation 8 months ago",
      },
      {
        label: "Labs",
        value: "FeNO = 45 ppb, EOS = 550 cells/μL, IgE = 22 IU/mL",
      },
    ],
    leftOption: "Anti-IgE",
    rightOption: "Anti–IL-5/IL-5R",
    correctSide: "right",
    topic: "asthma",
    explanation:
      "Elevated FeNO and EOS levels and a recent exacerbation despite current treatment suggest severe uncontrolled asthma that could be treated with a biologic. Steroid avoidance should be prioritized given her diabetes, and her biomarkers suggest ongoing eosinophilic inflammation, making an anti–IL-5 the preferred option over an anti-IgE — her IgE level is below the recommended dosing range for anti-IgE treatment.",
  },
  {
    id: "c5",
    ageSex: "Luis, 19-year-old male",
    image: "./patients/luis.webp",
    fields: [
      {
        label: "History",
        value:
          "Asthma since age 8; new college student; missed his last follow-up",
      },
      {
        label: "Symptoms",
        value: "Increased cough, chest tightness, and rescue inhaler use",
      },
      {
        label: "Treatment",
        value:
          "Budesonide/formoterol (160 mcg/4.5 mcg) 1 puff/day; albuterol as needed",
      },
      { label: "Labs", value: "FeNO = 18 ppb, EOS = 148 cells/μL" },
    ],
    leftOption: "Add a biologic",
    rightOption: "Optimize current management",
    correctSide: "right",
    topic: "asthma",
    explanation:
      "Considering missed follow-up appointments and recent lifestyle changes, treatment optimization (eg, checking inhaler technique and adherence, considering a switch to maintenance and reliever therapy [MART]) is the recommended first course of action. While Luis could qualify for an anti-TSLP agent in the future, it might be too early to add on a biologic.",
  },
  {
    id: "c6",
    ageSex: "Owen, 8-year-old male",
    image: "./patients/owen.webp",
    fields: [
      {
        label: "History",
        value:
          "Asthma diagnosed after a hospital stay; underweight (BMI 13.5)",
      },
      {
        label: "Symptoms",
        value:
          "Wheezing and increased rescue-inhaler use; eating less due to reflux and food feeling stuck",
      },
      {
        label: "Treatment",
        value: "Budesonide/formoterol, albuterol as needed, omeprazole",
      },
      { label: "Labs", value: "FeNO = 23 ppb, EOS = 342 cells/μL" },
    ],
    leftOption: "Depemokimab",
    rightOption: "Dupilumab",
    correctSide: "right",
    topic: "asthma",
    explanation:
      "Elevated FeNO and EOS levels despite current treatment suggest severe eosinophilic asthma that could be treated with an add-on biologic. His high eosinophil level and eating difficulties raise concern for eosinophilic esophagitis (EoE). Dupilumab is approved to treat severe asthma in patients age ≥6 years and EoE in patients ≥1 year, whereas depemokimab is approved to treat asthma in patients age ≥12 years.",
  },
  {
    id: "c7",
    ageSex: "Douglas, 68-year-old male",
    image: "./patients/douglas.webp",
    fields: [
      {
        label: "History",
        value: "40-year former smoker; tobacco-free for 8 years",
      },
      {
        label: "Exacerbations",
        value: "3 moderate exacerbations in previous years, no hospitalizations",
      },
      {
        label: "Treatment",
        value: "Triple inhaled therapy (LABA + LAMA + ICS)",
      },
      { label: "Labs", value: "FEV1 = 52% predicted, EOS = 348 cells/μL" },
    ],
    leftOption: "Add a biologic",
    rightOption: "Add roflumilast",
    correctSide: "left",
    topic: "copd",
    explanation:
      "According to GOLD 2026 recommendations, a patient on triple inhaled therapy experiencing ≥2 moderate (or 1 severe) exacerbations with a blood EOS ≥300 cells/μL should start biologic therapy with either dupilumab or mepolizumab. Roflumilast is recommended if the blood EOS is <100 cells/μL, FEV1 is <50%, and chronic bronchitis is present.",
  },
  {
    id: "c8",
    ageSex: "Mia, 63-year-old female",
    image: "./patients/mia.webp",
    fields: [
      {
        label: "History",
        value:
          "COPD diagnosed 1 year ago; 46-year smoker — resumed smoking to cope with caregiving stress",
      },
      {
        label: "Symptoms",
        value: "No exacerbations since diagnosis and no bothersome symptoms",
      },
      { label: "Treatment", value: "Long-acting bronchodilator" },
      {
        label: "Labs",
        value: "FEV1 = 83% predicted, EOS = 120 cells/μL, CAAT score = 8",
      },
    ],
    leftOption: "Shared decision-making about adding an ICS",
    rightOption: "Shared decision-making about smoking cessation support",
    longOptions: true,
    correctSide: "right",
    topic: "copd",
    explanation:
      "Her history of no exacerbations and low symptom burden puts her in the Group A category of the GOLD 2026 Report, which recommends treatment with a bronchodilator. Her lack of bothersome symptoms does not warrant adding on additional pharmacotherapy. Discussions on ways to support permanent smoking cessation to prevent progression are essential to successful COPD management.",
  },
  {
    id: "c9",
    ageSex: "Ethel, 75-year-old female",
    image: "./patients/ethel.webp",
    fields: [
      {
        label: "History",
        value:
          "COPD diagnosed 3 years ago; former smoker, tobacco-free for 15 years",
      },
      { label: "Comorbidities", value: "Asthma" },
      {
        label: "Treatment",
        value: "LABA + LAMA; 2 moderate exacerbations in the past year",
      },
      { label: "Labs", value: "FEV1 = 58% predicted, EOS = 300 cells/μL" },
    ],
    leftOption: "Add a biologic",
    rightOption: "Add ICS",
    correctSide: "right",
    topic: "copd",
    explanation:
      "The GOLD 2026 recommendation for patients experiencing exacerbations on LABA + LAMA therapy is to escalate therapy by adding ICS before adding a biologic.",
  },
  {
    id: "c10",
    ageSex: "Olivia, 82-year-old female",
    image: "./patients/olivia.webp",
    fields: [
      {
        label: "History",
        value:
          "COPD diagnosed 4 years ago; 1 severe exacerbation 5 months ago",
      },
      {
        label: "Comorbidities",
        value: "Hay fever, joint pain, sinusitis requiring oral corticosteroids",
      },
      {
        label: "Treatment",
        value: "Triple inhaled therapy (LABA + LAMA + ICS)",
      },
      { label: "Labs", value: "FEV1 = 62% predicted, EOS = 989 cells/μL" },
    ],
    leftOption: "Mepolizumab",
    rightOption: "Benralizumab",
    correctSide: "left",
    topic: "copd",
    explanation:
      "Her current symptoms, medical history, and current blood EOS are highly suggestive of eosinophilic granulomatosis with polyangiitis (EGPA) and require investigation. Her recent severe exacerbation warrants consideration of adding on a biologic. Only mepolizumab is approved to treat both COPD and EGPA; benralizumab is not approved to treat COPD or EGPA.",
  },
  {
    id: "c11",
    ageSex: "Rohit, 72-year-old male",
    image: "./patients/rohit.webp",
    fields: [
      {
        label: "History",
        value:
          "Nonsmoker, former welder; COPD diagnosed 9 months ago; interstitial lung disease for 2 years",
      },
      {
        label: "Recent",
        value: "ER visit due to dyspnea 2 months ago",
      },
      {
        label: "Treatment",
        value: "Triple inhaled therapy and pirfenidone (antifibrotic)",
      },
      { label: "Labs", value: "FEV1 = 42% predicted, EOS = 89 cells/μL" },
    ],
    leftOption: "Shared decision-making about pulmonary rehabilitation",
    rightOption: "Shared decision-making about adding a biologic",
    longOptions: true,
    correctSide: "left",
    topic: "copd",
    explanation:
      "His COPD and ILD comorbidity and history of dyspnea require a multidisciplinary approach that might involve pulmonary rehabilitation. Adding a biologic is not warranted, given his low blood EOS level.",
  },
  {
    id: "c12",
    ageSex: "Lorenzo, 77-year-old male",
    image: "./patients/lorenzo.webp",
    fields: [
      {
        label: "History",
        value:
          "Vietnam veteran, former smoker; allergic fungal rhinosinusitis (AFRS) and COPD since age 68",
      },
      {
        label: "Symptoms",
        value:
          "Increased wheezing and bronchitis despite treatment adherence",
      },
      { label: "Treatment", value: "Triple inhaled therapy" },
      { label: "Labs", value: "FEV1 = 62% predicted, EOS = 489 cells/μL" },
    ],
    leftOption: "Dupilumab",
    rightOption: "Mepolizumab",
    correctSide: "left",
    topic: "copd",
    explanation:
      "His history of AFRS, chronic bronchitis, and high EOS make dupilumab a better choice for an add-on biologic than mepolizumab. Only dupilumab is FDA-approved to treat both AFRS and COPD.",
  },
];
