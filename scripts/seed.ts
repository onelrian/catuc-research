import { db } from "./db";
import { surveysTable, questionsTable, responsesTable, answersTable, usersTable, accountsTable, sessionsTable } from "./schema";
import { eq, sql } from "drizzle-orm";

async function seed() {
  console.log("🌱 Seeding database...");

  try {
    // 1. Create the Survey Metadata
    const [survey] = await db
      .insert(surveysTable)
      .values({
        title: "Financial Accessibility, Family Background, and Entrepreneurial Intentions among students of CATUC Bamenda",
        description: "Academic research study on how financial accessibility and family background influence the entrepreneurial intentions of university students.",
        isActive: true,
      })
      .returning({ id: surveysTable.id });

    const surveyId = survey.id;

    // 2. Define Questions
    const questions = [
      // SECTION A: DEMOGRAPHIC INFORMATION
      { section: "SECTION A: DEMOGRAPHIC INFORMATION", text: "Gender", type: "multiple_choice", options: ["Male", "Female", "Prefer not to say"], orderIndex: 0 },
      { section: "SECTION A: DEMOGRAPHIC INFORMATION", text: "Age Group", type: "multiple_choice", options: ["Below 18", "18 – 22", "23 – 27", "28 and above"], orderIndex: 1 },
      { section: "SECTION A: DEMOGRAPHIC INFORMATION", text: "Level of Study", type: "multiple_choice", options: ["100 Level", "200 Level", "300 Level", "400 Level", "500 and above", "Postgraduate"], orderIndex: 2 },
      { section: "SECTION A: DEMOGRAPHIC INFORMATION", text: "Faculty / School", type: "multiple_choice", options: ["Business & Management", "Engineering & Technology", "Health Sciences", "Tropical agriculture", "Other"], orderIndex: 3 },
      { section: "SECTION A: DEMOGRAPHIC INFORMATION", text: "Marital Status", type: "multiple_choice", options: ["Single", "Married", "Other"], orderIndex: 4 },
      { section: "SECTION A: DEMOGRAPHIC INFORMATION", text: "Do you have a part-time job or business currently?", type: "yes_no", options: ["Yes", "No"], orderIndex: 5 },
      { section: "SECTION A: DEMOGRAPHIC INFORMATION", text: "Are either of your parents / guardians self-employed or a business owner?", type: "multiple_choice", options: ["Yes", "No", "Not sure"], orderIndex: 6 },
      { section: "SECTION A: DEMOGRAPHIC INFORMATION", text: "What is your family's approximate monthly household income?", type: "multiple_choice", options: ["Below 50,000 FCFA", "50,000 – 150,000 FCFA", "150,000 – 300,000 FCFA", "Above 300,000 FCFA"], orderIndex: 7 },
      { section: "SECTION A: DEMOGRAPHIC INFORMATION", text: "What is the highest education level attained by your parent/guardian?", type: "multiple_choice", options: ["No formal education", "Primary", "Secondary", "University / Higher"], orderIndex: 8 },
      { section: "SECTION A: DEMOGRAPHIC INFORMATION", text: "Have you ever attended any entrepreneurship training or workshop?", type: "yes_no", options: ["Yes", "No"], orderIndex: 9 },

      // SECTION B: FINANCIAL ACCESSIBILITY
      { section: "SECTION B: FINANCIAL ACCESSIBILITY", sectionDescription: "1 = Strongly Disagree, 5 = Strongly Agree", text: "I am aware of the financial services (loans, savings, credit) available to students in Cameroon.", type: "rating", orderIndex: 10 },
      { section: "SECTION B: FINANCIAL ACCESSIBILITY", text: "I can easily access a bank account or mobile money account for my financial transactions.", type: "rating", orderIndex: 11 },
      { section: "SECTION B: FINANCIAL ACCESSIBILITY", text: "I believe I can obtain a loan or credit to start a business if I needed one.", type: "rating", orderIndex: 12 },
      { section: "SECTION B: FINANCIAL ACCESSIBILITY", text: "The cost of accessing financial services (fees, interest rates) in Cameroon is affordable for students like me.", type: "rating", orderIndex: 13 },
      { section: "SECTION B: FINANCIAL ACCESSIBILITY", text: "There are financial institutions or microfinance services located close enough to my school or home.", type: "rating", orderIndex: 14 },
      { section: "SECTION B: FINANCIAL ACCESSIBILITY", text: "I have a good understanding of how to manage personal finances and business funds.", type: "rating", orderIndex: 15 },
      { section: "SECTION B: FINANCIAL ACCESSIBILITY", text: "I am aware of government or institutional financial support programs available for young entrepreneurs in Cameroon.", type: "rating", orderIndex: 16 },
      { section: "SECTION B: FINANCIAL ACCESSIBILITY", text: "Lack of collateral or guarantor is a major barrier preventing me from accessing formal credit.", type: "rating", orderIndex: 17 },
      { section: "SECTION B: FINANCIAL ACCESSIBILITY", text: "I use mobile money or digital banking platforms for my financial transactions regularly.", type: "rating", orderIndex: 18 },
      { section: "SECTION B: FINANCIAL ACCESSIBILITY", text: "Access to startup financing would significantly increase my intention to start a business.", type: "rating", orderIndex: 19 },

      // SECTION C: FAMILY BACKGROUND
      { section: "SECTION C: FAMILY BACKGROUND", sectionDescription: "1 = Strongly Disagree, 5 = Strongly Agree", text: "At least one of my parents or close family members owns or has owned a business.", type: "rating", orderIndex: 20 },
      { section: "SECTION C: FAMILY BACKGROUND", text: "Growing up, I was regularly exposed to entrepreneurial activities within my family.", type: "rating", orderIndex: 21 },
      { section: "SECTION C: FAMILY BACKGROUND", text: "My family has always encouraged me to consider starting my own business.", type: "rating", orderIndex: 22 },
      { section: "SECTION C: FAMILY BACKGROUND", text: "I have learned important business and financial skills from observing my family members.", type: "rating", orderIndex: 23 },
      { section: "SECTION C: FAMILY BACKGROUND", text: "My family's financial situation gives me the confidence that I can get support to start a business.", type: "rating", orderIndex: 24 },
      { section: "SECTION C: FAMILY BACKGROUND", text: "My family has a strong network of business contacts that I could benefit from as an entrepreneur.", type: "rating", orderIndex: 25 },
      { section: "SECTION C: FAMILY BACKGROUND", text: "The entrepreneurial experiences of my parents or family members inspire me to pursue entrepreneurship.", type: "rating", orderIndex: 26 },
      { section: "SECTION C: FAMILY BACKGROUND", text: "My parents or guardians believe that entrepreneurship is a good and respected career choice.", type: "rating", orderIndex: 27 },
      { section: "SECTION C: FAMILY BACKGROUND", text: "My family background has positively shaped my attitude toward starting a business.", type: "rating", orderIndex: 28 },
      { section: "SECTION C: FAMILY BACKGROUND", text: "I would feel comfortable discussing my business ideas or plans with my family members.", type: "rating", orderIndex: 29 },

      // SECTION D: ENTREPRENEURIAL INTENTIONS
      { section: "SECTION D: ENTREPRENEURIAL INTENTIONS", sectionDescription: "1 = Strongly Disagree, 5 = Strongly Agree", text: "I am seriously considering starting my own business after graduation.", type: "rating", orderIndex: 30 },
      { section: "SECTION D: ENTREPRENEURIAL INTENTIONS", text: "I have a strong desire to become an entrepreneur in the future.", type: "rating", orderIndex: 31 },
      { section: "SECTION D: ENTREPRENEURIAL INTENTIONS", text: "I believe I have the personal qualities and skills needed to start and run a successful business.", type: "rating", orderIndex: 32 },
      { section: "SECTION D: ENTREPRENEURIAL INTENTIONS", text: "Starting a business seems like a realistic and achievable goal for me.", type: "rating", orderIndex: 33 },
      { section: "SECTION D: ENTREPRENEURIAL INTENTIONS", text: "I am willing to take the risks that come with starting and running a business.", type: "rating", orderIndex: 34 },
      { section: "SECTION D: ENTREPRENEURIAL INTENTIONS", text: "I find entrepreneurship to be a more attractive career path than formal employment.", type: "rating", orderIndex: 35 },
      { section: "SECTION D: ENTREPRENEURIAL INTENTIONS", text: "I have already begun to think about or plan a business idea I would like to pursue.", type: "rating", orderIndex: 36 },
      { section: "SECTION D: ENTREPRENEURIAL INTENTIONS", text: "People who are important to me (family, friends, lecturers) support my interest in entrepreneurship.", type: "rating", orderIndex: 37 },
      { section: "SECTION D: ENTREPRENEURIAL INTENTIONS", text: "I am able to identify business opportunities in my environment that I could potentially exploit.", type: "rating", orderIndex: 38 },
      { section: "SECTION D: ENTREPRENEURIAL INTENTIONS", text: "I am determined to create a business venture at some point in my professional life.", type: "rating", orderIndex: 39 },
    ];

    await db.insert(questionsTable).values(
      questions.map((q) => ({
        surveyId,
        text: q.text,
        type: q.type as any,
        options: q.options ?? [],
        isRequired: true,
        orderIndex: q.orderIndex,
        section: q.section,
        sectionDescription: q.sectionDescription,
      }))
    );

    console.log("✅ Seeding complete.");
    console.log(`🚀 Survey created with ID: ${surveyId}`);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

seed();
