import { db, surveysTable, questionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

export async function seedCatucQuestionnaire() {
  console.log("🌱 Seeding CATUC Research Questionnaire...");

  // Check if it already exists
  const existing = await db
    .select()
    .from(surveysTable)
    .where(eq(surveysTable.title, "Financial Accessibility, Family Background, and Entrepreneurial Intentions"));

  if (existing.length > 0) {
    console.log("✅ Questionnaire already exists. Skipping.");
    return;
  }

  // Create the survey
  const [survey] = await db.insert(surveysTable).values({
    title: "Financial Accessibility, Family Background, and Entrepreneurial Intentions",
    description: "Academic research study on how financial accessibility and family background influence the entrepreneurial intentions of university students at CATUC Bamenda.",
    isActive: true,
  }).returning();

  const questions = [
    // Section A: DEMOGRAPHIC
    { text: "Gender", type: "multiple_choice", options: ["Male", "Female", "Prefer not to say"], section: "Section A: Demographics", sectionDescription: "Please provide your demographic information. This data is collected for research purposes only." },
    { text: "Age Group", type: "multiple_choice", options: ["Below 18", "18 – 22", "23 – 27", "28 and above"], section: "Section A: Demographics" },
    { text: "Level of Study", type: "multiple_choice", options: ["100 Level", "200 Level", "300 Level", "400 Level", "500 and above", "Postgraduate"], section: "Section A: Demographics" },
    { text: "Faculty / School", type: "multiple_choice", options: ["Business & Management", "Engineering & Technology", "Health Sciences", "Tropical Agriculture", "Other"], section: "Section A: Demographics" },
    { text: "Marital Status", type: "multiple_choice", options: ["Single", "Married", "Other"], section: "Section A: Demographics" },
    { text: "Do you have a part-time job or business currently?", type: "yes_no", section: "Section A: Demographics" },
    { text: "Are either of your parents / guardians self-employed or a business owner?", type: "multiple_choice", options: ["Yes", "No", "Not sure"], section: "Section A: Demographics" },
    { text: "What is your family's approximate monthly household income?", type: "multiple_choice", options: ["Below 50,000 FCFA", "50,000 – 150,000 FCFA", "150,000 – 300,000 FCFA", "Above 300,000 FCFA"], section: "Section A: Demographics" },
    { text: "What is the highest education level attained by your parent/guardian?", type: "multiple_choice", options: ["No formal education", "Primary", "Secondary", "University / Higher"], section: "Section A: Demographics" },
    { text: "Have you ever attended any entrepreneurship training or workshop?", type: "yes_no", section: "Section A: Demographics" },

    // Section B: FINANCIAL ACCESSIBILITY (B1-B10)
    { text: "I am aware of the financial services (loans, savings, credit) available to students in Cameroon.", type: "rating", section: "Section B: Financial Accessibility", sectionDescription: "Rate how much you agree or disagree with each statement on a scale of 1 (Lowest) to 10 (Highest)." },
    { text: "I can easily access a bank account or mobile money account for my financial transactions.", type: "rating", section: "Section B: Financial Accessibility" },
    { text: "I believe I can obtain a loan or credit to start a business if I needed one.", type: "rating", section: "Section B: Financial Accessibility" },
    { text: "The cost of accessing financial services (fees, interest rates) in Cameroon is affordable for students like me.", type: "rating", section: "Section B: Financial Accessibility" },
    { text: "There are financial institutions or microfinance services located close enough to my school or home.", type: "rating", section: "Section B: Financial Accessibility" },
    { text: "I have a good understanding of how to manage personal finances and business funds.", type: "rating", section: "Section B: Financial Accessibility" },
    { text: "I am aware of government or institutional financial support programs available for young entrepreneurs in Cameroon.", type: "rating", section: "Section B: Financial Accessibility" },
    { text: "Lack of collateral or guarantor is a major barrier preventing me from accessing formal credit.", type: "rating", section: "Section B: Financial Accessibility" },
    { text: "I use mobile money or digital banking platforms for my financial transactions regularly.", type: "rating", section: "Section B: Financial Accessibility" },
    { text: "Access to startup financing would significantly increase my intention to start a business.", type: "rating", section: "Section B: Financial Accessibility" },

    // Section C: FAMILY BACKGROUND
    { text: "At least one of my parents or close family members owns or has owned a business.", type: "rating", section: "Section C: Family Background", sectionDescription: "Rate how much you agree or disagree with each statement on a scale of 1 (Lowest) to 10 (Highest)." },
    { text: "Growing up, I was regularly exposed to entrepreneurial activities within my family.", type: "rating", section: "Section C: Family Background" },
    { text: "My family has always encouraged me to consider starting my own business.", type: "rating", section: "Section C: Family Background" },
    { text: "I have learned important business and financial skills from observing my family members.", type: "rating", section: "Section C: Family Background" },
    { text: "My family's financial situation gives me the confidence that I can get support to start a business.", type: "rating", section: "Section C: Family Background" },
    { text: "My family has a strong network of business contacts that I could benefit from as an entrepreneur.", type: "rating", section: "Section C: Family Background" },
    { text: "The entrepreneurial experiences of my parents or family members inspire me to pursue entrepreneurship.", type: "rating", section: "Section C: Family Background" },
    { text: "My parents or guardians believe that entrepreneurship is a good and respected career choice.", type: "rating", section: "Section C: Family Background" },
    { text: "My family background has positively shaped my attitude toward starting a business.", type: "rating", section: "Section C: Family Background" },
    { text: "I would feel comfortable discussing my business ideas or plans with my family members.", type: "rating", section: "Section C: Family Background" },

    // Section D: ENTREPRENEURIAL INTENTIONS
    { text: "I am seriously considering starting my own business after graduation.", type: "rating", section: "Section D: Entrepreneurial Intentions", sectionDescription: "Rate how much you agree or disagree with each statement on a scale of 1 (Lowest) to 10 (Highest)." },
    { text: "I have a strong desire to become an entrepreneur in the future.", type: "rating", section: "Section D: Entrepreneurial Intentions" },
    { text: "I believe I have the personal qualities and skills needed to start and run a successful business.", type: "rating", section: "Section D: Entrepreneurial Intentions" },
    { text: "Starting a business seems like a realistic and achievable goal for me.", type: "rating", section: "Section D: Entrepreneurial Intentions" },
    { text: "I am willing to take the risks that come with starting and running a business.", type: "rating", section: "Section D: Entrepreneurial Intentions" },
    { text: "I find entrepreneurship to be a more attractive career path than formal employment.", type: "rating", section: "Section D: Entrepreneurial Intentions" },
    { text: "I have already begun to think about or plan a business idea I would like to pursue.", type: "rating", section: "Section D: Entrepreneurial Intentions" },
    { text: "People who are important to me (family, friends, lecturers) support my interest in entrepreneurship.", type: "rating", section: "Section D: Entrepreneurial Intentions" },
    { text: "I am able to identify business opportunities in my environment that I could potentially exploit.", type: "rating", section: "Section D: Entrepreneurial Intentions" },
    { text: "I am determined to create a business venture at some point in my professional life.", type: "rating", section: "Section D: Entrepreneurial Intentions" },
  ];

  await db.insert(questionsTable).values(
    questions.map((q, i) => ({
      surveyId: survey.id,
      text: q.text,
      type: q.type as any,
      options: (q as any).options || [],
      isRequired: true,
      orderIndex: i,
      section: (q as any).section || null,
      sectionDescription: (q as any).sectionDescription || null,
    }))
  );

  console.log("✨ Seeding complete!");
}
