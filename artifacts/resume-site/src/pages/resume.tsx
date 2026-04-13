import React, { useEffect, useRef } from "react";
import { 
  useGetResume, 
  getGetResumeQueryKey, 
  useRecordView 
} from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  Briefcase, 
  GraduationCap, 
  Award, 
  MapPin, 
  Mail, 
  Phone, 
  Globe, 
  Linkedin,
  Share2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ResumePage() {
  const { data: resume, isLoading, error } = useGetResume({ 
    query: { queryKey: getGetResumeQueryKey() } 
  });
  const { mutate: recordView } = useRecordView();
  const { toast } = useToast();
  
  const hasRecordedView = useRef(false);

  useEffect(() => {
    if (!hasRecordedView.current) {
      recordView({ data: { referrer: document.referrer || "direct" } });
      hasRecordedView.current = true;
    }
  }, [recordView]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Link copied to clipboard",
      description: "You can now share this resume.",
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-4xl space-y-8 animate-pulse">
        <Skeleton className="h-32 w-full rounded-lg" />
        <Skeleton className="h-48 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  if (error || !resume) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-4xl flex items-center justify-center text-center min-h-[50vh]">
        <div className="space-y-4">
          <h2 className="font-serif text-2xl text-foreground">Could not load resume</h2>
          <p className="text-muted-foreground">Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="bg-card text-card-foreground shadow-xl rounded-xl overflow-hidden border border-border">
        {/* Header Section */}
        <div className="bg-primary/5 p-8 sm:p-12 border-b border-border">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
            <div>
              <h1 className="font-serif text-4xl sm:text-5xl font-bold tracking-tight text-foreground">
                {resume.name}
              </h1>
              <p className="text-xl sm:text-2xl text-primary font-medium mt-2">
                {resume.title}
              </p>
            </div>
            <Button onClick={handleShare} variant="outline" className="gap-2 shrink-0 rounded-full border-primary/20 hover:bg-primary/10 hover:text-primary">
              <Share2 className="h-4 w-4" />
              Copy Link
            </Button>
          </div>

          <div className="flex flex-wrap gap-y-3 gap-x-6 mt-8 text-sm text-muted-foreground">
            {resume.location && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>{resume.location}</span>
              </div>
            )}
            {resume.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <a href={`mailto:${resume.email}`} className="hover:text-primary transition-colors">{resume.email}</a>
              </div>
            )}
            {resume.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <a href={`tel:${resume.phone}`} className="hover:text-primary transition-colors">{resume.phone}</a>
              </div>
            )}
            {resume.linkedin && (
              <div className="flex items-center gap-2">
                <Linkedin className="h-4 w-4" />
                <a href={resume.linkedin} target="_blank" rel="noreferrer" className="hover:text-primary transition-colors">LinkedIn</a>
              </div>
            )}
            {resume.website && (
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                <a href={resume.website} target="_blank" rel="noreferrer" className="hover:text-primary transition-colors">Website</a>
              </div>
            )}
          </div>
        </div>

        <div className="p-8 sm:p-12 space-y-12">
          {/* Summary */}
          {resume.summary && (
            <section>
              <h2 className="font-serif text-2xl font-semibold mb-4 text-foreground flex items-center gap-2">
                Professional Summary
              </h2>
              <p className="text-muted-foreground leading-relaxed text-base">
                {resume.summary}
              </p>
            </section>
          )}

          {/* Experience */}
          {resume.experience && resume.experience.length > 0 && (
            <section>
              <h2 className="font-serif text-2xl font-semibold mb-6 text-foreground flex items-center gap-2 border-b pb-2">
                <Briefcase className="h-5 w-5 text-primary" />
                Experience
              </h2>
              <div className="space-y-8">
                {resume.experience.map((job, idx) => (
                  <div key={idx} className="relative pl-6 border-l-2 border-primary/20">
                    <div className="absolute w-3 h-3 bg-background border-2 border-primary rounded-full -left-[7px] top-1.5" />
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <h3 className="text-lg font-bold text-foreground">{job.role}</h3>
                      <span className="text-sm font-medium text-primary bg-primary/10 px-3 py-1 rounded-full whitespace-nowrap">
                        {job.startDate} — {job.endDate || "Present"}
                      </span>
                    </div>
                    <div className="text-md font-medium text-muted-foreground mb-3">
                      {job.company}
                    </div>
                    {job.description && (
                      <p className="text-muted-foreground mb-3 text-sm">{job.description}</p>
                    )}
                    {job.bullets && job.bullets.length > 0 && (
                      <ul className="space-y-2 mt-3">
                        {job.bullets.map((bullet, bIdx) => (
                          <li key={bIdx} className="text-muted-foreground text-sm flex gap-3">
                            <span className="text-primary mt-1 text-xs">•</span>
                            <span>{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Education */}
          {resume.education && resume.education.length > 0 && (
            <section>
              <h2 className="font-serif text-2xl font-semibold mb-6 text-foreground flex items-center gap-2 border-b pb-2">
                <GraduationCap className="h-5 w-5 text-primary" />
                Education
              </h2>
              <div className="grid sm:grid-cols-2 gap-6">
                {resume.education.map((edu, idx) => (
                  <div key={idx} className="bg-muted/30 p-5 rounded-lg border border-border">
                    <h3 className="font-bold text-foreground mb-1">{edu.degree} in {edu.field}</h3>
                    <div className="text-muted-foreground text-sm font-medium mb-3">{edu.institution}</div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                      <span className="bg-background px-2 py-1 rounded-md border border-border">
                        {edu.startYear} — {edu.endYear || "Present"}
                      </span>
                      {edu.gpa && <span>GPA: {edu.gpa}</span>}
                    </div>
                    {edu.honors && (
                      <p className="text-sm text-primary font-medium mt-2">{edu.honors}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          <div className="grid sm:grid-cols-2 gap-12">
            {/* Skills */}
            {resume.skills && resume.skills.length > 0 && (
              <section>
                <h2 className="font-serif text-2xl font-semibold mb-6 text-foreground flex items-center gap-2 border-b pb-2">
                  Skills
                </h2>
                <div className="flex flex-wrap gap-2">
                  {resume.skills.map((skill, idx) => (
                    <Badge key={idx} variant="secondary" className="bg-secondary/10 text-secondary-foreground hover:bg-secondary/20 transition-colors py-1.5 px-3">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </section>
            )}

            {/* Certifications */}
            {resume.certifications && resume.certifications.length > 0 && (
              <section>
                <h2 className="font-serif text-2xl font-semibold mb-6 text-foreground flex items-center gap-2 border-b pb-2">
                  <Award className="h-5 w-5 text-primary" />
                  Certifications
                </h2>
                <ul className="space-y-3">
                  {resume.certifications.map((cert, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-muted-foreground">
                      <div className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                      <span className="text-sm">{cert}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
