import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import {
  useGetSurvey,
  getGetSurveyQueryKey,
  useSubmitResponse,
  Question,
} from "@workspace/api-client-react";

export default function SurveyPage() {
  const { surveyId } = useParams<{ surveyId: string }>();
  const id = parseInt(surveyId || "0", 10);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: survey, isLoading, error } = useGetSurvey(id, {
    query: {
      enabled: !!id && !isNaN(id),
      queryKey: getGetSurveyQueryKey(id),
    }
  });

  const { mutate: submitResponse, isPending: isSubmitting } = useSubmitResponse();

  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (isNaN(id)) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-destructive">Invalid Survey ID</h2>
        </div>
      </Layout>
    );
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto space-y-6 mt-8 animate-pulse">
          <div className="h-8 bg-muted rounded w-1/2"></div>
          <div className="h-4 bg-muted rounded w-full"></div>
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="h-4 bg-muted rounded w-1/3"></div>
              <div className="h-10 bg-muted rounded w-full"></div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  if (error || !survey) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto text-center py-12 border rounded-lg bg-destructive/5 text-destructive border-destructive/20 mt-8">
          <h2 className="text-xl font-semibold mb-2">Survey Not Found</h2>
          <p>We couldn't find the survey you're looking for or it may no longer be available.</p>
          <Button variant="outline" className="mt-4" onClick={() => setLocation("/")}>
            Return to Available Studies
          </Button>
        </div>
      </Layout>
    );
  }

  if (isSubmitted) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto text-center py-16 px-4 mt-8 bg-card border rounded-lg shadow-sm">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
          </div>
          <h2 className="text-3xl font-serif font-semibold text-primary mb-4">Response Recorded</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-lg mx-auto">
            Thank you for participating in "{survey.title}". Your contribution is valuable to our research.
          </p>
          <Button onClick={() => setLocation("/")} size="lg">
            Return to Available Studies
          </Button>
        </div>
      </Layout>
    );
  }

  const questions = survey.questions || [];
  const answeredCount = Object.keys(answers).filter(k => {
    const val = answers[Number(k)];
    if (Array.isArray(val)) return val.length > 0;
    return val !== undefined && val !== "";
  }).length;
  
  const progress = questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0;

  const handleAnswerChange = (questionId: number, value: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleCheckboxChange = (questionId: number, option: string, checked: boolean) => {
    setAnswers(prev => {
      const current = prev[questionId] || [];
      if (checked) {
        return { ...prev, [questionId]: [...current, option] };
      } else {
        return { ...prev, [questionId]: current.filter((item: string) => item !== option) };
      }
    });
  };

  const handleSubmit = () => {
    // Validate required fields
    const missingRequired = questions.filter(q => q.isRequired && !answers[q.id]);
    
    if (missingRequired.length > 0) {
      toast({
        title: "Missing Information",
        description: "Please answer all required questions before submitting.",
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

    submitResponse({
      surveyId: survey.id,
      data: { answers: formattedAnswers }
    }, {
      onSuccess: () => {
        setIsSubmitted(true);
        window.scrollTo(0, 0);
      },
      onError: () => {
        toast({
          title: "Submission Error",
          description: "There was a problem submitting your response. Please try again.",
          variant: "destructive"
        });
      }
    });
  };

  const renderQuestionInput = (question: Question) => {
    const value = answers[question.id];

    switch (question.type) {
      case "text":
        return (
          <Textarea 
            placeholder="Type your answer here..."
            value={value || ""}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            className="min-h-[100px] resize-y"
          />
        );
      
      case "yes_no":
        return (
          <RadioGroup 
            value={value} 
            onValueChange={(val) => handleAnswerChange(question.id, val)}
            className="flex flex-col space-y-2"
          >
            <div className="flex items-center space-x-2 border rounded-md p-3 hover:bg-muted/50 cursor-pointer transition-colors" onClick={() => handleAnswerChange(question.id, "Yes")}>
              <RadioGroupItem value="Yes" id={`q${question.id}-yes`} />
              <Label htmlFor={`q${question.id}-yes`} className="flex-1 cursor-pointer">Yes</Label>
            </div>
            <div className="flex items-center space-x-2 border rounded-md p-3 hover:bg-muted/50 cursor-pointer transition-colors" onClick={() => handleAnswerChange(question.id, "No")}>
              <RadioGroupItem value="No" id={`q${question.id}-no`} />
              <Label htmlFor={`q${question.id}-no`} className="flex-1 cursor-pointer">No</Label>
            </div>
          </RadioGroup>
        );

      case "multiple_choice":
        // For simplicity, we'll use checkboxes if the user can select multiple, 
        // but the DB schema just says options string[]. 
        // Let's assume radio for single choice unless we explicitly know it's multi.
        // We will default to single choice radio for multiple_choice.
        return (
          <RadioGroup 
            value={value} 
            onValueChange={(val) => handleAnswerChange(question.id, val)}
            className="flex flex-col space-y-2"
          >
            {question.options?.map((option, idx) => (
              <div 
                key={idx} 
                className="flex items-center space-x-2 border rounded-md p-3 hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => handleAnswerChange(question.id, option)}
              >
                <RadioGroupItem value={option} id={`q${question.id}-opt${idx}`} />
                <Label htmlFor={`q${question.id}-opt${idx}`} className="flex-1 cursor-pointer">{option}</Label>
              </div>
            ))}
          </RadioGroup>
        );

      case "rating":
        const ratingVal = value ? parseInt(value, 10) : 0;
        return (
          <div className="pt-6 pb-2 px-2">
            <Slider 
              value={[ratingVal]} 
              min={1} 
              max={10} 
              step={1}
              onValueChange={(vals) => handleAnswerChange(question.id, vals[0].toString())}
              className="mb-6"
            />
            <div className="flex justify-between text-xs text-muted-foreground font-medium">
              <span>1 (Lowest)</span>
              <span className="text-primary font-bold text-sm bg-primary/10 px-2 py-0.5 rounded">{ratingVal || '-'}</span>
              <span>10 (Highest)</span>
            </div>
          </div>
        );

      default:
        return <p className="text-sm text-muted-foreground">Unsupported question type</p>;
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-8 mt-4 mb-16">
        <div className="space-y-4">
          <h1 className="text-3xl font-serif font-semibold text-primary tracking-tight">{survey.title}</h1>
          {survey.description && (
            <p className="text-lg text-muted-foreground leading-relaxed">
              {survey.description}
            </p>
          )}
        </div>

        <div className="sticky top-16 z-40 bg-background/95 backdrop-blur py-4 border-b">
          <div className="flex justify-between text-sm font-medium mb-2">
            <span className="text-muted-foreground">Progress</span>
            <span className="text-primary">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="space-y-8 mt-8">
          {questions.map((q, index) => (
            <Card key={q.id} className="border-border/50 shadow-sm overflow-hidden" id={`question-${q.id}`}>
              <CardHeader className="bg-muted/20 border-b border-border/50 pb-4">
                <div className="flex gap-3">
                  <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-semibold mt-0.5">
                    {index + 1}
                  </span>
                  <div className="space-y-1">
                    <CardTitle className="text-lg leading-snug font-medium text-foreground">
                      {q.text}
                      {q.isRequired && <span className="text-destructive ml-1" title="Required">*</span>}
                    </CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6 pb-6">
                {renderQuestionInput(q)}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="pt-4 flex justify-end border-t mt-12">
          <Button 
            size="lg" 
            onClick={handleSubmit} 
            disabled={isSubmitting || questions.length === 0}
            className="w-full sm:w-auto px-8"
          >
            {isSubmitting ? "Submitting..." : "Submit Response"}
          </Button>
        </div>
      </div>
    </Layout>
  );
}
