"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, CheckCircle2, Loader2 } from "lucide-react";
import { submitSurveyResponse } from "@/app/actions";

const LIKERT_SHORT = ["SD", "D", "N", "A", "SA"];
const LIKERT_FULL = ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"];
const LIKERT_COLORS = [
  "hover:bg-rose-100 dark:hover:bg-rose-950/50 data-[state=checked]:bg-rose-500 data-[state=checked]:text-white data-[state=checked]:border-rose-500",
  "hover:bg-orange-100 dark:hover:bg-orange-950/50 data-[state=checked]:bg-orange-500 data-[state=checked]:text-white data-[state=checked]:border-orange-500",
  "hover:bg-slate-100 dark:hover:bg-slate-800 data-[state=checked]:bg-slate-500 data-[state=checked]:text-white data-[state=checked]:border-slate-500",
  "hover:bg-emerald-100 dark:hover:bg-emerald-950/50 data-[state=checked]:bg-emerald-500 data-[state=checked]:text-white data-[state=checked]:border-emerald-500",
  "hover:bg-emerald-100 dark:hover:bg-emerald-950/50 data-[state=checked]:bg-emerald-700 data-[state=checked]:text-white data-[state=checked]:border-emerald-700",
];

/**
 * Generate or retrieve a persistent anonymous ID from localStorage.
 * Used to prevent duplicate submissions from the same browser.
 */
function getAnonymousId(): string {
  const STORAGE_KEY = "catuc_anonymous_id";
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(STORAGE_KEY, id);
  }
  return id;
}

export function SurveyForm({ survey, initialIsAuthenticated }: { survey: any; initialIsAuthenticated: boolean }) {
  const router = useRouter();
  const { toast } = useToast();

  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const anonymousIdRef = useRef<string>("");

  useEffect(() => {
    // Generate/retrieve anonymous ID on mount (client-side only)
    if (!initialIsAuthenticated) {
      anonymousIdRef.current = getAnonymousId();
    }
  }, [initialIsAuthenticated]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentSectionIndex]);

  const sections = useMemo(() => {
    if (!survey?.questions) return [];
    
    const sectionMap = new Map<string, { title: string, description?: string, questions: any[] }>();
    
    survey.questions.forEach((q: any) => {
      const secTitle = q.section || "General";
      if (!sectionMap.has(secTitle)) {
        sectionMap.set(secTitle, {
          title: secTitle,
          description: q.sectionDescription,
          questions: []
        });
      }
      sectionMap.get(secTitle)!.questions.push(q);
    });

    return Array.from(sectionMap.values());
  }, [survey]);

  if (isSubmitted) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl mx-auto text-center py-24 px-8 mt-12 bg-card border rounded-2xl shadow-xl"
      >
        <div className="w-24 h-24 bg-emerald-500/10 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-8">
          <CheckCircle2 className="w-12 h-12" />
        </div>
        <h2 className="text-4xl font-serif font-bold text-foreground mb-6">Response Recorded</h2>
        <p className="text-xl text-muted-foreground mb-12 max-w-lg mx-auto leading-relaxed">
          Your responses have been securely submitted to the CATUC research database. Thank you for your valuable contribution to this study.
        </p>
        <Button onClick={() => router.push("/")} size="lg" className="px-8 py-6 text-lg rounded-full">
          Return to Studies
        </Button>
      </motion.div>
    );
  }

  const currentSection = sections[currentSectionIndex];
  const totalSections = sections.length;
  const questions = survey.questions || [];
  
  const answeredCount = Object.keys(answers).filter(k => {
    const val = answers[Number(k)];
    if (Array.isArray(val)) return val.length > 0;
    return val !== undefined && val !== "";
  }).length;
  
  const overallProgress = questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0;
  
  const sectionQuestions = currentSection?.questions || [];
  const sectionAnsweredCount = sectionQuestions.filter(q => {
    const val = answers[q.id];
    if (Array.isArray(val)) return val.length > 0;
    return val !== undefined && val !== "";
  }).length;

  const handleAnswerChange = (questionId: number, value: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleNextSection = () => {
    const missingRequired = sectionQuestions.filter(q => q.isRequired && (!answers[q.id] || (Array.isArray(answers[q.id]) && answers[q.id].length === 0)));
    
    if (missingRequired.length > 0) {
      toast({
        title: "Incomplete Section",
        description: "Please answer all required questions before proceeding.",
        variant: "destructive"
      });
      return;
    }

    if (currentSectionIndex < totalSections - 1) {
      setCurrentSectionIndex(prev => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrevSection = () => {
    if (currentSectionIndex > 0) {
      setCurrentSectionIndex(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    const missingRequired = questions.filter((q: any) => q.isRequired && (!answers[q.id] || (Array.isArray(answers[q.id]) && answers[q.id].length === 0)));
    
    if (missingRequired.length > 0) {
      toast({
        title: "Missing Information",
        description: `Please answer all required questions across all sections before submitting. (${missingRequired.length} remaining)`,
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    const formattedAnswers = Object.entries(answers).map(([qId, val]) => {
      const id = Number(qId);
      if (Array.isArray(val)) {
        return { questionId: id, values: val };
      }
      return { questionId: id, value: String(val) };
    });
    
    const result = await submitSurveyResponse(survey.id, {
      answers: formattedAnswers,
      anonymousId: initialIsAuthenticated ? undefined : anonymousIdRef.current,
    });
    
    if (result.success) {
      setIsSubmitted(true);
      window.scrollTo(0, 0);
    } else {
      toast({
        title: "Submission Error",
        description: result.error || "Failed to submit response. Please try again.",
        variant: "destructive",
      });
    }
    setIsSubmitting(false);
  };

  const renderQuestionInput = (question: any) => {
    const value = answers[question.id];
    const isLikert = question.type === "multiple_choice" && 
                     question.options && 
                     question.options.length === 5 && 
                     question.options[0] === "Strongly Disagree";

    if (isLikert) {
      return (
        <div className="mt-4">
          <div className="hidden sm:flex rounded-lg overflow-hidden border border-border/60 shadow-sm divide-x divide-border/60 bg-muted/5">
            {question.options.map((option: string, idx: number) => {
              const isSelected = value === option;
              return (
                <TooltipProvider key={idx}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() => handleAnswerChange(question.id, option)}
                        data-state={isSelected ? "checked" : "unchecked"}
                        className={`flex-1 py-4 text-sm font-semibold transition-all duration-200 outline-none
                          ${LIKERT_COLORS[idx]}
                          ${!isSelected ? 'text-muted-foreground' : ''}
                        `}
                      >
                        {LIKERT_SHORT[idx]}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="font-medium">
                      {option}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            })}
          </div>
          
          <div className="flex flex-col sm:hidden gap-2 mt-4">
            {question.options.map((option: string, idx: number) => {
              const isSelected = value === option;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleAnswerChange(question.id, option)}
                  data-state={isSelected ? "checked" : "unchecked"}
                  className={`w-full py-3 px-4 rounded-lg text-sm font-semibold text-left transition-all border border-border/60 shadow-sm
                    ${LIKERT_COLORS[idx]}
                    ${!isSelected ? 'bg-card text-foreground' : ''}
                  `}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    switch (question.type) {
      case "text":
        return (
          <Textarea 
            placeholder="Type your detailed answer here..."
            value={value || ""}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleAnswerChange(question.id, e.target.value)}
            className="min-h-[120px] resize-y mt-4 text-base bg-background/50 focus:bg-background transition-colors"
          />
        );
      
      case "yes_no":
        return (
          <div className="grid grid-cols-2 gap-4 mt-4">
            {["Yes", "No"].map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => handleAnswerChange(question.id, opt)}
                className={`py-4 px-6 rounded-xl border-2 transition-all font-semibold text-lg flex items-center justify-center
                  ${value === opt 
                    ? 'border-primary bg-primary/5 text-primary shadow-sm' 
                    : 'border-border/60 hover:border-primary/30 hover:bg-muted/30 text-muted-foreground'
                  }
                `}
              >
                {opt}
              </button>
            ))}
          </div>
        );

      case "multiple_choice":
        return (
          <div className="space-y-3 mt-4">
            {question.options?.map((option: string, idx: number) => {
              const isSelected = value === option;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleAnswerChange(question.id, option)}
                  className={`w-full flex items-center p-4 rounded-xl border-2 transition-all text-left group
                    ${isSelected 
                      ? 'border-primary bg-primary/5 shadow-sm' 
                      : 'border-border/40 hover:border-primary/30 hover:bg-muted/20 bg-card'
                    }
                  `}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mr-4 transition-colors
                    ${isSelected ? 'border-primary' : 'border-muted-foreground/40 group-hover:border-primary/50'}
                  `}>
                    {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                  </div>
                  <span className={`text-base font-medium ${isSelected ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'}`}>
                    {option}
                  </span>
                </button>
              );
            })}
          </div>
        );

      case "rating":
        return (
          <div className="mt-4">
            {/* Desktop: compact button row */}
            <div className="hidden sm:flex rounded-lg overflow-hidden border border-border/60 shadow-sm divide-x divide-border/60 bg-muted/5">
              {LIKERT_FULL.map((label, idx) => {
                const ratingValue = String(idx + 1);
                const isSelected = value === ratingValue;
                return (
                  <TooltipProvider key={idx}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          onClick={() => handleAnswerChange(question.id, ratingValue)}
                          data-state={isSelected ? "checked" : "unchecked"}
                          className={`flex-1 py-4 text-sm font-semibold transition-all duration-200 outline-none
                            ${LIKERT_COLORS[idx]}
                            ${!isSelected ? 'text-muted-foreground' : ''}
                          `}
                        >
                          {LIKERT_SHORT[idx]}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="font-medium">
                        {idx + 1} — {label}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              })}
            </div>
            
            {/* Mobile: stacked buttons */}
            <div className="flex flex-col sm:hidden gap-2 mt-4">
              {LIKERT_FULL.map((label, idx) => {
                const ratingValue = String(idx + 1);
                const isSelected = value === ratingValue;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleAnswerChange(question.id, ratingValue)}
                    data-state={isSelected ? "checked" : "unchecked"}
                    className={`w-full py-3 px-4 rounded-lg text-sm font-semibold text-left transition-all border border-border/60 shadow-sm
                      ${LIKERT_COLORS[idx]}
                      ${!isSelected ? 'bg-card text-foreground' : ''}
                    `}
                  >
                    {idx + 1} — {label}
                  </button>
                );
              })}
            </div>
          </div>
        );

      default:
        return <p className="text-sm text-muted-foreground mt-4">Unsupported question format</p>;
    }
  };
  // Login is optional — no auth gate here

  if (!currentSection) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-10 mt-6 mb-24">
      <div className="space-y-6">
        <h1 className="text-4xl font-serif font-bold text-foreground tracking-tight">{survey.title}</h1>
        <div className="p-5 rounded-2xl bg-muted/30 border border-border/50">
          <div className="flex justify-between text-sm font-semibold mb-3">
            <span className="text-muted-foreground uppercase tracking-wider text-xs">Overall Progress</span>
            <span className="text-primary">{overallProgress}%</span>
          </div>
          <Progress value={overallProgress} className="h-2" />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 py-4">
        {sections.map((sec, idx) => {
          const isPast = idx < currentSectionIndex;
          const isCurrent = idx === currentSectionIndex;
          const sectionComplete = sec.questions.every((q: any) => {
            const val = answers[q.id];
            if (Array.isArray(val)) return val.length > 0;
            return val !== undefined && val !== "";
          });
          return (
            <div 
              key={sec.title} 
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1.5
                ${isCurrent ? 'bg-primary text-primary-foreground shadow-md' : 
                  isPast && sectionComplete ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' :
                  isPast ? 'bg-primary/10 text-primary border border-primary/20' : 
                  'bg-muted/50 text-muted-foreground border border-border/50'}
              `}
            >
              {sectionComplete && !isCurrent && <CheckCircle2 className="w-3.5 h-3.5" />}
              Step {idx + 1}: {sec.title.replace(/^Section [A-Z]:\s*/i, '')}
            </div>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div 
          key={currentSectionIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          className="space-y-8"
        >
          <div className="space-y-3 pb-4 border-b-2 border-border">
            <h2 className="text-3xl font-serif font-semibold text-foreground">{currentSection.title}</h2>
            {currentSection.description && (
              <p className="text-lg text-muted-foreground leading-relaxed">{currentSection.description}</p>
            )}
          </div>

          <div className="space-y-10">
            {sectionQuestions.map((q, qIdx) => {
              const globalIdx = questions.findIndex((gq: any) => gq.id === q.id);
              const isAnswered = (() => {
                const val = answers[q.id];
                if (Array.isArray(val)) return val.length > 0;
                return val !== undefined && val !== "";
              })();
              return (
                <div key={q.id} className={`rounded-xl p-5 -mx-5 transition-colors ${isAnswered ? 'bg-emerald-500/[0.03]' : ''}`}>
                  <div className="flex items-start gap-3">
                    <span className={`text-xs font-bold mt-1.5 px-2 py-0.5 rounded-full shrink-0 transition-colors ${
                      isAnswered ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground'
                    }`}>
                      Q{globalIdx + 1}
                    </span>
                    <h3 className="text-xl font-medium text-foreground leading-snug">
                      {q.text}
                    </h3>
                  </div>
                  {renderQuestionInput(q)}
                </div>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="fixed bottom-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-xl border-t border-border">
        <div className="max-w-4xl mx-auto p-4 sm:p-6 flex justify-between items-center">
          <Button 
            variant="outline" 
            size="lg" 
            onClick={handlePrevSection} 
            disabled={currentSectionIndex === 0}
            className="px-6 rounded-full font-semibold"
          >
            <ChevronLeft className="w-5 h-5 mr-2" />
            Previous
          </Button>
          
          <div className="text-xs text-muted-foreground font-medium hidden sm:block">
            {sectionAnsweredCount}/{sectionQuestions.length} answered
          </div>
          <Button 
            size="lg" 
            onClick={handleNextSection} 
            disabled={isSubmitting}
            className="px-8 rounded-full font-semibold shadow-md text-base"
          >
            {isSubmitting ? (
              <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Submitting...</>
            ) : currentSectionIndex === totalSections - 1 ? (
              "Submit Response"
            ) : (
              <>Next Section <ChevronRight className="w-5 h-5 ml-2" /></>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
