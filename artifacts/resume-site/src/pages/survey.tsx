import { useState, useMemo, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, CheckCircle2, Minus, Plus } from "lucide-react";
import {
  useGetSurvey,
  getGetSurveyQueryKey,
  useSubmitResponse,
  Question,
} from "@workspace/api-client-react";
import { useAuth } from "@workspace/auth-web";

const LIKERT_OPTIONS = ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"];
const LIKERT_SHORT = ["SD", "D", "N", "A", "SA"];
const LIKERT_COLORS = [
  "hover:bg-rose-100 dark:hover:bg-rose-950/50 data-[state=checked]:bg-rose-500 data-[state=checked]:text-white data-[state=checked]:border-rose-500",
  "hover:bg-orange-100 dark:hover:bg-orange-950/50 data-[state=checked]:bg-orange-500 data-[state=checked]:text-white data-[state=checked]:border-orange-500",
  "hover:bg-slate-100 dark:hover:bg-slate-800 data-[state=checked]:bg-slate-500 data-[state=checked]:text-white data-[state=checked]:border-slate-500",
  "hover:bg-emerald-100 dark:hover:bg-emerald-950/50 data-[state=checked]:bg-emerald-500 data-[state=checked]:text-white data-[state=checked]:border-emerald-500",
  "hover:bg-emerald-100 dark:hover:bg-emerald-950/50 data-[state=checked]:bg-emerald-700 data-[state=checked]:text-white data-[state=checked]:border-emerald-700",
];

export default function SurveyPage() {
  const { surveyId } = useParams<{ surveyId: string }>();
  const id = parseInt(surveyId || "0", 10);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading: isAuthLoading, login } = useAuth();

  const { data: survey, isLoading, error } = useGetSurvey(id, {
    query: {
      enabled: !!id && !isNaN(id),
      queryKey: getGetSurveyQueryKey(id),
    }
  });

  const { mutate: submitResponse, isPending: isSubmitting } = useSubmitResponse();

  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentSectionIndex]);

  // ── All hooks MUST be called before any conditional returns ──
  const sections = useMemo(() => {
    if (!survey?.questions) return [];
    
    const sectionMap = new Map<string, { title: string, description?: string, questions: Question[] }>();
    
    // Group by section
    survey.questions.forEach((q) => {
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

    // Convert to array and preserve a sensible order
    return Array.from(sectionMap.values());
  }, [survey]);

  // ── Conditional returns (safe — all hooks have been called above) ──

  if (isAuthLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground font-serif">Verifying identity...</div>
        </div>
      </Layout>
    );
  }

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="max-w-xl mx-auto text-center py-20 px-8 border rounded-2xl bg-muted/20 mt-12 shadow-sm">
          <h2 className="text-2xl font-serif font-semibold mb-4 text-foreground">Identity Verification</h2>
          <p className="text-lg text-muted-foreground mb-10 max-w-sm mx-auto leading-relaxed">
            Please log in to participate. This ensures data integrity and helps us prevent duplicate submissions.
          </p>
          <Button size="lg" onClick={() => login()} className="px-10 py-6 text-lg rounded-full shadow-lg hover:shadow-primary/20 transition-all font-semibold">
            Log In to Begin
          </Button>
        </div>
      </Layout>
    );
  }

  if (isNaN(id)) {
    return (
      <Layout>
        <div className="text-center py-20">
          <h2 className="text-2xl font-serif font-semibold text-destructive">Invalid Survey ID</h2>
        </div>
      </Layout>
    );
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto space-y-8 mt-12 animate-pulse">
          <div className="h-10 bg-muted rounded w-2/3"></div>
          <div className="h-2 bg-muted rounded w-full"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Card key={i}>
                <CardContent className="p-8 space-y-6">
                  <div className="h-6 bg-muted rounded w-3/4"></div>
                  <div className="h-12 bg-muted rounded w-full"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !survey) {
    return (
      <Layout>
        <div className="max-w-xl mx-auto text-center py-20 px-8 border rounded-2xl bg-destructive/5 text-destructive border-destructive/20 mt-12 shadow-sm">
          <h2 className="text-2xl font-serif font-semibold mb-4">Study Not Found</h2>
          <p className="text-lg opacity-90 mb-8">We couldn't locate the requested instrument or it may be closed.</p>
          <Button variant="outline" size="lg" onClick={() => setLocation("/")}>
            Return to Directory
          </Button>
        </div>
      </Layout>
    );
  }

  if (isSubmitted) {
    return (
      <Layout>
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
            Your data has been successfully securely transmitted to the CATUC research database. Thank you for your contribution.
          </p>
          <Button onClick={() => setLocation("/")} size="lg" className="px-8 py-6 text-lg rounded-full">
            Return to Directory
          </Button>
        </motion.div>
      </Layout>
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
    // Validate current section required fields
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

  const handleSubmit = () => {
    const missingRequired = questions.filter(q => q.isRequired && (!answers[q.id] || (Array.isArray(answers[q.id]) && answers[q.id].length === 0)));
    
    if (missingRequired.length > 0) {
      toast({
        title: "Missing Information",
        description: "Please answer all required questions across all sections before submitting.",
        variant: "destructive"
      });
      return;
    }

    const formattedAnswers = Object.entries(answers).map(([qId, val]) => {
      const id = Number(qId);
      if (Array.isArray(val)) {
        return { questionId: id, values: val };
      }
      return { questionId: id, value: String(val) };
    });

    console.log("Submitting survey response...", { surveyId: survey.id, answers: formattedAnswers });

    submitResponse({
      surveyId: survey.id,
      data: { answers: formattedAnswers }
    }, {
      onSuccess: () => {
        console.log("Submission successful");
        setIsSubmitted(true);
        window.scrollTo(0, 0);
      },
      onError: (err: any) => {
        console.error("Submission failed:", err);
        // Extract error message from the custom ApiError class or fallback
        const errorMessage = err?.data?.error || err?.message || "There was a problem submitting your response. Please try again.";
        
        toast({
          title: "Submission Error",
          description: errorMessage,
          variant: "destructive"
        });
      }
    });
  };

  const renderQuestionInput = (question: Question) => {
    const value = answers[question.id];

    // Check if it's a Likert scale question
    const isLikert = question.type === "multiple_choice" && 
                     question.options && 
                     question.options.length === 5 && 
                     question.options[0] === "Strongly Disagree";

    if (isLikert) {
      return (
        <div className="mt-4">
          {/* Desktop View */}
          <div className="hidden sm:flex rounded-lg overflow-hidden border border-border/60 shadow-sm divide-x divide-border/60 bg-muted/5">
            {question.options.map((option, idx) => {
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
          
          {/* Mobile View */}
          <div className="flex flex-col sm:hidden gap-2 mt-4">
            {question.options.map((option, idx) => {
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
          <div className="flex justify-between mt-3 text-xs text-muted-foreground font-medium px-1 sm:hidden">
            <span>Strongly Disagree</span>
            <span>Strongly Agree</span>
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
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
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
            {question.options?.map((option, idx) => {
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
        const ratingVal = value ? parseInt(value, 10) : 0;
        return (
          <div className="pt-8 pb-4 px-2 mt-2 bg-muted/10 rounded-xl border border-border/40 px-6">
            <div className="flex items-center gap-4 mb-8">
              <Button
                variant="outline"
                size="icon"
                className="rounded-full shrink-0 h-10 w-10 border-border/40 hover:bg-background"
                onClick={() => handleAnswerChange(question.id, Math.max(1, ratingVal - 1).toString())}
                disabled={ratingVal <= 1 && !!ratingVal}
              >
                <Minus className="h-4 w-4" />
              </Button>
              
              <Slider 
                value={[ratingVal || 5]} 
                min={1} 
                max={10} 
                step={1}
                onValueChange={(vals) => handleAnswerChange(question.id, vals[0].toString())}
                className="flex-1"
              />

              <Button
                variant="outline"
                size="icon"
                className="rounded-full shrink-0 h-10 w-10 border-border/40 hover:bg-background"
                onClick={() => handleAnswerChange(question.id, Math.min(10, (ratingVal || 5) + 1).toString())}
                disabled={ratingVal >= 10}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex justify-between items-center text-sm font-medium">
              <span className="text-muted-foreground">1 - Lowest</span>
              <div className="text-center">
                <div className={`w-14 h-14 flex items-center justify-center text-2xl font-bold rounded-full shadow-lg ring-4 transition-all duration-200 scale-110 
                  ${ratingVal ? 'bg-primary text-primary-foreground ring-primary/20' : 'bg-muted text-muted-foreground ring-muted/20'}
                `}>
                  {ratingVal || '-'}
                </div>
                {!ratingVal && <p className="text-[10px] text-primary mt-2 uppercase tracking-tighter font-bold animate-pulse">Select rating</p>}
              </div>
              <span className="text-muted-foreground">10 - Highest</span>
            </div>
          </div>
        );

      default:
        return <p className="text-sm text-muted-foreground mt-4">Unsupported question format</p>;
    }
  };

  if (!currentSection) {
    return (
      <Layout>
        <div className="max-w-xl mx-auto text-center py-20 px-8 border rounded-2xl bg-muted/20 mt-12 shadow-sm">
          <h2 className="text-2xl font-serif font-semibold mb-4 text-foreground">Survey Not Available</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-sm mx-auto leading-relaxed">
            This survey has no questions yet. Please check back later.
          </p>
          <Button variant="outline" size="lg" onClick={() => setLocation("/")}>Return to Directory</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-10 mt-6 mb-24">
        
        {/* Header & Global Progress */}
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

        {/* Section Stepper */}
        <div className="flex flex-wrap gap-2 py-4">
          {sections.map((sec, idx) => {
            const isPast = idx < currentSectionIndex;
            const isCurrent = idx === currentSectionIndex;
            return (
              <div 
                key={sec.title} 
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all
                  ${isCurrent ? 'bg-primary text-primary-foreground shadow-md' : 
                    isPast ? 'bg-primary/10 text-primary border border-primary/20' : 
                    'bg-muted/50 text-muted-foreground border border-border/50'}
                `}
              >
                Step {idx + 1}: {sec.title.replace(/^Section [A-Z]:\s*/i, '')}
              </div>
            );
          })}
        </div>

        {/* Current Section Container */}
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
              <h2 className="text-3xl font-serif font-semibold text-foreground">
                {currentSection.title}
              </h2>
              {currentSection.description && (
                <p className="text-lg text-muted-foreground leading-relaxed">
                  {currentSection.description}
                </p>
              )}
              <div className="text-sm font-medium text-muted-foreground pt-2">
                {sectionAnsweredCount} of {sectionQuestions.length} questions answered in this section
              </div>
            </div>

            <div className="space-y-10">
              {sectionQuestions.map((q) => (
                <div key={q.id} id={`question-${q.id}`} className="scroll-mt-32">
                  <div className="space-y-2 mb-2">
                    <h3 className="text-xl font-medium text-foreground leading-snug">
                      <span className="text-primary/70 mr-2 font-serif font-bold">
                        {/* Try to extract prefix if it exists like "B1." */}
                        {q.text.match(/^[A-Z0-9]+\./) ? '' : ''}
                      </span>
                      {q.text}
                      {q.isRequired && <span className="text-destructive ml-2 font-bold" title="Required">*</span>}
                    </h3>
                  </div>
                  {renderQuestionInput(q)}
                </div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Sticky Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-xl border-t border-border shadow-[0_-10px_40px_rgba(0,0,0,0.05)] dark:shadow-[0_-10px_40px_rgba(0,0,0,0.2)]">
          <div className="max-w-4xl mx-auto p-4 sm:p-6 flex justify-between items-center">
            <Button 
              variant="outline" 
              size="lg" 
              onClick={handlePrevSection} 
              disabled={currentSectionIndex === 0 || isSubmitting}
              className="px-6 rounded-full font-semibold"
            >
              <ChevronLeft className="w-5 h-5 mr-2" />
              Previous
            </Button>
            
            <Button 
              size="lg" 
              onClick={handleNextSection} 
              disabled={isSubmitting || sectionQuestions.length === 0}
              className="px-8 rounded-full font-semibold shadow-md text-base"
            >
              {currentSectionIndex === totalSections - 1 ? (
                isSubmitting ? "Submitting..." : "Submit Response"
              ) : (
                <>Next Section <ChevronRight className="w-5 h-5 ml-2" /></>
              )}
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
