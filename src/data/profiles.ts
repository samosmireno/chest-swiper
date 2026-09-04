import type { PatientProfile } from "../types";

// 12 cases transcribed from documents/cases.pptx (slides 2–13): 6 severe
// asthma (biologic selection) followed by 6 COPD (GOLD 2026 escalation).
// Name, age line, bullets and the abbreviation footnote are the slide's
// verbatim, in the slide's order, keeping its abbreviations (FeNO, EOS, IgE,
// FEV1, CAAT) as printed. Three typographic slips on the slides are
// normalised: "7-year-old-male" (c2), "LABA + LAMA+ ICS" (c10) and the
// "4-6 times/day" hyphen range (c6, set as an en dash like c5's). The option
// labels and rationales are unchanged from v2.0.
export const profiles: PatientProfile[] = [
  {
    id: "c1",
    name: "Khloe",
    ageSex: "24-year-old female",
    image: "./patients/khloe.webp",
    bullets: [
      "Diagnosed with asthma at age 20",
      "History of eczema in childhood",
      "Currently on the budesonide/formoterol (160 mcg/4.5 mcg), tiotropium, and a rescue inhaler",
      "ED visit 2 months ago due to shortness of breath",
      "FeNO: 50 ppb; EOS: 389 cells/μL",
    ],
    footnote:
      "ED = emergency department; EOS = eosinophil; FeNO = fractional exhaled nitric oxide; ICS = inhaled corticosteroid.",
    leftOption: "Add a biologic",
    rightOption: "Optimize current management",
    correctSide: "left",
    topic: "asthma",
    explanation:
      "Elevated blood eosinophil and FeNO levels, the recent ED visit, and poor control of symptoms despite high-dose maintenance treatment warrant shared decision-making about adding a biologic to treat Khloe's severe asthma.",
  },
  {
    id: "c2",
    name: "Kevin",
    ageSex: "7-year-old male",
    image: "./patients/kevin.webp",
    bullets: [
      "History of dog and peanut allergies; practices avoidance strategies",
      "Frequently wakes at night coughing",
      "Currently on budesonide/formoterol (80 mcg/4.5 mcg) and needs albuterol 3–4 times/week as a rescue inhaler; demonstrates correct inhaler technique",
      "FeNO: 35 ppb; EOS: 150 cells/μL; IgE: 300 IU/mL",
    ],
    footnote:
      "EOS = eosinophil; FeNO = fractional exhaled nitric oxide; ICS = inhaled corticosteroid; IgE = immunoglobulin E; IL = interleukin.",
    leftOption: "Omalizumab",
    rightOption: "Mepolizumab",
    correctSide: "left",
    topic: "asthma",
    explanation:
      "Given his atopic tendencies, food allergies, and under-controlled asthma despite adequate inhaler technique, omalizumab, which targets IgE, is the better choice over mepolizumab, which targets IL-5, as an add-on biologic.",
  },
  {
    id: "c3",
    name: "Miles",
    ageSex: "13-year-old male",
    image: "./patients/miles.webp",
    bullets: [
      "Diagnosed with asthma at age 8",
      "History of atopic dermatitis (somewhat controlled with steroid cream; frequent flares)",
      "Reports increased shortness of breath and chest tightness, especially during soccer team practice, requiring rescue inhaler 4–5 days/week",
      "Currently on fluticasone/vilanterol (200 mcg/25 mcg) and rescue inhaler (albuterol)",
      "FeNO: 38 ppb; EOS: 168 cells/μL; IgE: 5 IU/mL",
    ],
    footnote:
      "EOS = eosinophil; FeNO = fractional exhaled nitric oxide; LABA = long-acting β2-agonist; ICS = inhaled corticosteroid.",
    leftOption: "Omalizumab",
    rightOption: "Dupilumab",
    correctSide: "right",
    topic: "asthma",
    explanation:
      "Elevated FeNO and EOS levels, along with worsening symptoms despite treatment, suggest poorly controlled severe asthma with ongoing type 2 inflammation. His history of atopic dermatitis makes dupilumab an attractive choice over omalizumab as an add-on biologic, as dupilumab is indicated to treat atopic dermatitis and asthma.",
  },
  {
    id: "c4",
    name: "Claire",
    ageSex: "47-year-old female",
    image: "./patients/claire.webp",
    bullets: [
      "Diagnosed with asthma at age 32, former smoker (5 pack-years); tobacco-free for 10 years",
      "Comorbidities: insulin-dependent diabetes, nasal polyps, seasonal allergies",
      "1 exacerbation 8 months ago",
      "Currently on high-dose fluticasone/salmeterol (500 mcg/50 mcg)",
      "FeNO: 45 ppb; EOS: 550 cells/μL; IgE: 22 IU/mL",
    ],
    footnote:
      "EOS = eosinophil; FeNO = fractional exhaled nitric oxide; IgE = immunoglobulin E; IL = interleukin; LABA = long-acting β2-agonist.",
    leftOption: "Anti-IgE",
    rightOption: "Anti–IL-5/IL-5R",
    correctSide: "right",
    topic: "asthma",
    explanation:
      "Elevated FeNO and EOS levels and a recent exacerbation despite current treatment suggest severe uncontrolled asthma that could be treated with a biologic. Steroid avoidance should be prioritized given her diabetes, and her biomarkers suggest ongoing eosinophilic inflammation, making an anti–IL-5 the preferred option over an anti-IgE — her IgE level is below the recommended dosing range for anti-IgE treatment.",
  },
  {
    id: "c5",
    name: "Luis",
    ageSex: "19-year-old male",
    image: "./patients/luis.webp",
    bullets: [
      "Diagnosed with asthma at age 8",
      "Reports increased cough, chest tightness, and use of rescue inhaler",
      "Currently on budesonide/formoterol (160 mcg/4.5 mcg, 1 puff/day) and as-needed albuterol (90 mcg, 2 puffs up to 4–6 times/day)",
      "FeNO: 18 ppb; EOS: 148 cells/μL",
      "Started college this semester; missed previous follow-up appointment",
    ],
    footnote:
      "EOS = eosinophil; FeNO = fractional exhaled nitric oxide; ICS = inhaled corticosteroid; LABA = long-acting β2-agonist; SABA = short-acting β2-agonist.",
    leftOption: "Add a biologic",
    rightOption: "Optimize current management",
    correctSide: "right",
    topic: "asthma",
    explanation:
      "Considering missed follow-up appointments and recent lifestyle changes, treatment optimization (eg, checking inhaler technique and adherence, considering a switch to maintenance and reliever therapy [MART]) is the recommended first course of action. While Luis could qualify for an anti-TSLP agent in the future, it might be too early to add on a biologic.",
  },
  {
    id: "c6",
    name: "Owen",
    ageSex: "8-year-old male",
    image: "./patients/owen.webp",
    bullets: [
      "Diagnosed with asthma after hospital stay 3 months ago",
      "Underweight (20 kg; BMI: 13.5); mother reports he’s eating less due to frequent acid reflux, difficulty swallowing, and food feeling stuck in his chest; GI appointment is imminent",
      "Medications at discharge: budesonide/formoterol, prednisolone (3-day course)",
      "Current medication: budesonide/formoterol (80 mcg/4.5 mcg, 1 puff/day) and as-needed albuterol (90 mcg, 2 puffs up to 4–6 times/day), omeprazole",
      "Reports wheezing and increased use of rescue inhaler at 3-month follow-up",
      "FeNO: 23 ppb; EOS: 342 cells/μL; NKA",
    ],
    footnote:
      "EOS = eosinophil; FeNO = fractional exhaled nitric oxide; NKA = no known allergies.",
    leftOption: "Depemokimab",
    rightOption: "Dupilumab",
    correctSide: "right",
    topic: "asthma",
    explanation:
      "Elevated FeNO and EOS levels despite current treatment suggest severe eosinophilic asthma that could be treated with an add-on biologic. His high eosinophil level and eating difficulties raise concern for eosinophilic esophagitis (EoE). Dupilumab is approved to treat severe asthma in patients age ≥6 years and EoE in patients ≥1 year, whereas depemokimab is approved to treat asthma in patients age ≥12 years.",
  },
  {
    id: "c7",
    name: "Douglas",
    ageSex: "68-year-old male",
    image: "./patients/douglas.webp",
    bullets: [
      "40-year former smoker; tobacco-free for 8 years",
      "Currently on triple inhaled therapy (LABA + LAMA + ICS)",
      "3 moderate exacerbations in previous years, no hospitalizations",
      "FEV1: 52% predicted; EOS: 348 cells/μL",
    ],
    footnote:
      "EOS = eosinophil; FEV1 = forced expiratory volume in 1 second; GOLD = Global Initiative for Chronic Obstructive Lung Disease; LABA = long-acting β2-agonist; LAMA = long-acting muscarinic antagonist; ICS = inhaled corticosteroid.",
    leftOption: "Add a biologic",
    rightOption: "Add roflumilast",
    correctSide: "left",
    topic: "copd",
    explanation:
      "According to GOLD 2026 recommendations, a patient on triple inhaled therapy experiencing ≥2 moderate (or 1 severe) exacerbations with a blood EOS ≥300 cells/μL should start biologic therapy with either dupilumab or mepolizumab. Roflumilast is recommended if the blood EOS is <100 cells/μL, FEV1 is <50%, and chronic bronchitis is present.",
  },
  {
    id: "c8",
    name: "Mia",
    ageSex: "63-year-old female",
    image: "./patients/mia.webp",
    bullets: [
      "Diagnosed with COPD 1 year ago; 46-year smoker",
      "Has tried several smoking cessation plans but reports resuming smoking to cope with stress due to caring for her husband with dementia",
      "No exacerbations since diagnosis; reports no increase in bothersome symptoms",
      "Currently on a long-acting bronchodilator",
      "FEV1: 83% predicted; EOS: 120 cells/μL; CAAT score: 8",
    ],
    footnote:
      "CAAT = chronic airways assessment test; COPD = chronic obstructive pulmonary disease; EOS = eosinophil; FEV1 = forced expiratory volume in 1 second; ICS = inhaled corticosteroid.",
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
    name: "Ethel",
    ageSex: "75-year-old female",
    image: "./patients/ethel.webp",
    bullets: [
      "Diagnosed with COPD 3 years ago, former smoker; tobacco-free for 15 years",
      "Comorbidities: asthma",
      "2 moderate exacerbations in the past year",
      "Currently on LABA + LAMA",
      "FEV1: 58% predicted; EOS: 300 cells/μL",
    ],
    footnote:
      "COPD = chronic obstructive pulmonary disease; EOS = eosinophil; FEV1 = forced expiratory volume in 1 second; ICS = inhaled corticosteroid; LABA = long-acting β2-agonist; LAMA = long-acting muscarinic antagonist.",
    leftOption: "Add a biologic",
    rightOption: "Add ICS",
    correctSide: "right",
    topic: "copd",
    explanation:
      "The GOLD 2026 recommendation for patients experiencing exacerbations on LABA + LAMA therapy is to escalate therapy by adding ICS before adding a biologic.",
  },
  {
    id: "c10",
    name: "Olivia",
    ageSex: "82-year-old female",
    image: "./patients/olivia.webp",
    bullets: [
      "Diagnosed with COPD 4 years ago; tobacco-free for 10 years",
      "Currently presenting with shortness of breath, chest tightness, and sinus pressure",
      "Currently on triple inhaled therapy (LABA + LAMA + ICS)",
      "History of hay fever, joint pain, and sinusitis treated with short courses of oral corticosteroids",
      "1 severe exacerbation 5 months ago",
      "FEV1: 62% predicted; EOS: 989 cells/μL",
    ],
    footnote:
      "COPD = chronic obstructive pulmonary disease; EGPA = eosinophilic granulomatosis with polyangiitis; EOS = eosinophil; FEV1 = forced expiratory volume in 1 second; ICS = inhaled corticosteroid; LABA = long-acting β2-agonist; LAMA = long-acting muscarinic antagonist.",
    leftOption: "Mepolizumab",
    rightOption: "Benralizumab",
    correctSide: "left",
    topic: "copd",
    explanation:
      "Her current symptoms, medical history, and current blood EOS are highly suggestive of eosinophilic granulomatosis with polyangiitis (EGPA) and require investigation. Her recent severe exacerbation warrants consideration of adding on a biologic. Only mepolizumab is approved to treat both COPD and EGPA; benralizumab is not approved to treat COPD or EGPA.",
  },
  {
    id: "c11",
    name: "Rohit",
    ageSex: "72-year-old male",
    image: "./patients/rohit.webp",
    bullets: [
      "Nonsmoker; former industrial welder",
      "Diagnosed with COPD after hospital stay 9 months ago; previously diagnosed with interstitial lung disease 2 years ago",
      "Visited ER due to dyspnea 2 months ago (no hospitalization)",
      "On triple inhaled therapy (LABA + LAMA + ICS) and antifibrotic (pirfenidone)",
      "FEV1: 42% predicted; EOS: 89 cells/μL",
    ],
    footnote:
      "COPD = chronic obstructive pulmonary disease; EOS = eosinophil; ER = emergency room; FEV1 = forced expiratory volume in 1 second; ICS = inhaled corticosteroid; ILD = interstitial lung disease; LABA = long-acting β2-agonist; LAMA = long-acting muscarinic antagonist.",
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
    name: "Lorenzo",
    ageSex: "77-year-old male",
    image: "./patients/lorenzo.webp",
    bullets: [
      "Vietnam veteran, former smoker",
      "Diagnosed with allergic fungal rhinosinusitis (AFRS) and COPD at age 68 after treatment at a VA center",
      "Functional endoscopic sinus surgery performed 3 years ago",
      "Currently on triple inhaled therapy",
      "Reports to VA center due to increased wheezing and bronchitis despite treatment adherence",
      "FEV1: 62% predicted; EOS: 489 cells/μL",
    ],
    footnote:
      "AFRS = allergic fungal rhinosinusitis; COPD = chronic obstructive pulmonary disease; EOS = eosinophil; FEV1 = forced expiratory volume in 1 second; VA = Veterans Affairs.",
    leftOption: "Dupilumab",
    rightOption: "Mepolizumab",
    correctSide: "left",
    topic: "copd",
    explanation:
      "His history of AFRS, chronic bronchitis, and high EOS make dupilumab a better choice for an add-on biologic than mepolizumab. Only dupilumab is FDA-approved to treat both AFRS and COPD.",
  },
];
