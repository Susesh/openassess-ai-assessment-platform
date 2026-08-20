"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Sparkles, Database, Shield, Eye, Mic, Camera, Check, Loader2 } from "lucide-react";
import api from "@/services/api";

interface FormData {
  title: string;
  jobRole: string;
  timeLimit: number;
  passingScore: number;
  selectedQuestions: number[];
  generatedQuestions: any[];
  proctoringConfig: {
    facialTracking: boolean;
    tabLockdown: boolean;
    audioDetection: boolean;
    snapshotInterval: number;
  };
}

interface QuestionPaper {
  id: number;
  title: string;
  subject: string;
  year: number;
  board: string;
  question_count: number;
}

interface Question {
  id: number;
  text: string;
  options: string[];
  correct_answer: string;
  difficulty: string;
  subject: string;
}

const JOB_ROLES = [
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "SDE-1",
  "SDE-2",
  "Data Analyst",
  "Data Scientist",
  "DevOps Engineer",
  "QA Engineer",
  "Product Manager",
];

const EXAMS = ["JEE", "NEET", "CBSE", "UPSC", "KEA", "GATE", "CAT"];

export default function NewAssessmentPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"pyq" | "ai">("pyq");
  const [questionPapers, setQuestionPapers] = useState<QuestionPaper[]>([]);
  const [paperQuestions, setPaperQuestions] = useState<Question[]>([]);
  const [selectedPaper, setSelectedPaper] = useState<number | null>(null);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiDescription, setAiDescription] = useState("");
  const [aiQuestionCount, setAiQuestionCount] = useState(5);
  const [formData, setFormData] = useState<FormData>({
    title: "",
    jobRole: "",
    timeLimit: 60,
    passingScore: 40,
    selectedQuestions: [],
    generatedQuestions: [],
    proctoringConfig: {
      facialTracking: true,
      tabLockdown: true,
      audioDetection: false,
      snapshotInterval: 30,
    },
  });

  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updateProctoringConfig = (field: keyof FormData["proctoringConfig"], value: any) => {
    setFormData((prev) => ({
      ...prev,
      proctoringConfig: { ...prev.proctoringConfig, [field]: value },
    }));
  };

  // Fetch question papers on mount
  useEffect(() => {
    fetchQuestionPapers();
  }, []);

  const fetchQuestionPapers = async () => {
    try {
      const response = await api.get("/employer/question-papers");
      setQuestionPapers(response.data);
    } catch (error) {
      console.error("Failed to fetch question papers:", error);
    }
  };

  const fetchPaperQuestions = async (paperId: number) => {
    try {
      const response = await api.get(`/employer/question-papers/${paperId}/questions`);
      setPaperQuestions(response.data);
      setSelectedPaper(paperId);
    } catch (error) {
      console.error("Failed to fetch paper questions:", error);
    }
  };

  const toggleQuestionSelection = (questionId: number) => {
    setFormData((prev) => ({
      ...prev,
      selectedQuestions: prev.selectedQuestions.includes(questionId)
        ? prev.selectedQuestions.filter((id) => id !== questionId)
        : [...prev.selectedQuestions, questionId],
    }));
  };

  const generateAIQuestions = async () => {
    if (!aiDescription.trim()) {
      alert("Please enter a description for the questions");
      return;
    }
    
    setAiGenerating(true);
    try {
      const response = await api.post("/employer/generate-questions", {
        topic: formData.jobRole,
        subject: formData.jobRole,
        difficulty: "medium",
        count: aiQuestionCount,
        description: aiDescription,
      });
      setFormData((prev) => ({
        ...prev,
        generatedQuestions: response.data,
      }));
    } catch (error) {
      console.error("Failed to generate AI questions:", error);
      alert("Failed to generate questions. Please try again.");
    } finally {
      setAiGenerating(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      await api.post("/employer/assessments", {
        title: formData.title,
        subject: formData.jobRole,
        time_limit_mins: formData.timeLimit,
        passing_score_pct: formData.passingScore,
        selected_questions: formData.selectedQuestions,
        generated_questions: formData.generatedQuestions,
        proctoring_config: formData.proctoringConfig,
      });
      router.push("/employer");
    } catch (error) {
      console.error("Failed to create assessment:", error);
      alert("Failed to create assessment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (step < 3) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <div className="min-h-screen bg-[#F5F6F7] text-[#2B2E33]">
      {/* Header */}
      <div className="border-b border-[#C1C4C8] bg-[#F5F6F7]">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-[#C1C4C8]/20 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-[#7B7F85]" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-[#2B2E33]">Create Assessment</h1>
              <p className="text-[#7B7F85] text-sm">Step {step} of 3</p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex items-center gap-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex-1">
              <div
                className={`h-2 rounded-full transition-colors ${
                  s <= step ? "bg-[#2B2E33]" : "bg-[#C1C4C8]"
                }`}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-xs text-[#7B7F85] font-semibold">
          <span>Test Settings</span>
          <span>Questions</span>
          <span>Proctoring</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 pb-12">
        {step === 1 && (
          <div className="bg-[#F5F6F7] border border-[#C1C4C8] rounded-2xl p-8 shadow-sm">
            <h2 className="text-xl font-bold text-[#2B2E33] mb-6">Test Meta & Settings</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-[#7B7F85] uppercase tracking-wider mb-2">Assessment Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => updateFormData("title", e.target.value)}
                  placeholder="e.g., Frontend Developer Technical Assessment"
                  className="w-full px-4 py-3 bg-[#F5F6F7] border border-[#C1C4C8] rounded-xl text-[#2B2E33] placeholder-[#7B7F85] focus:outline-none focus:ring-2 focus:ring-[#2B2E33]/15"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#7B7F85] uppercase tracking-wider mb-2">Job Role Target</label>
                <select
                  value={formData.jobRole}
                  onChange={(e) => updateFormData("jobRole", e.target.value)}
                  className="w-full px-4 py-3 bg-[#F5F6F7] border border-[#C1C4C8] rounded-xl text-[#2B2E33] focus:outline-none focus:ring-2 focus:ring-[#2B2E33]/15"
                >
                  <option value="">Select a role...</option>
                  {JOB_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-[#7B7F85] uppercase tracking-wider mb-2">Time Limit (minutes)</label>
                  <input
                    type="number"
                    value={formData.timeLimit}
                    onChange={(e) => updateFormData("timeLimit", parseInt(e.target.value))}
                    min="15"
                    max="180"
                    className="w-full px-4 py-3 bg-[#F5F6F7] border border-[#C1C4C8] rounded-xl text-[#2B2E33] focus:outline-none focus:ring-2 focus:ring-[#2B2E33]/15"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#7B7F85] uppercase tracking-wider mb-2">Passing Score (%)</label>
                  <input
                    type="number"
                    value={formData.passingScore}
                    onChange={(e) => updateFormData("passingScore", parseInt(e.target.value))}
                    min="0"
                    max="100"
                    className="w-full px-4 py-3 bg-[#F5F6F7] border border-[#C1C4C8] rounded-xl text-[#2B2E33] focus:outline-none focus:ring-2 focus:ring-[#2B2E33]/15"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-8">
              <button
                onClick={nextStep}
                disabled={!formData.title || !formData.jobRole}
                className="flex items-center gap-2 px-6 py-3 bg-[#2B2E33] hover:bg-[#2B2E33]/90 disabled:bg-[#C1C4C8] disabled:cursor-not-allowed text-[#F5F6F7] rounded-xl font-semibold transition-colors shadow-sm"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="bg-[#F5F6F7] border border-[#C1C4C8] rounded-2xl p-8 shadow-sm">
            <h2 className="text-xl font-bold text-[#2B2E33] mb-6">Question Assembly</h2>
            
            {/* Tabs */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setActiveTab("pyq")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-colors ${
                  activeTab === "pyq"
                    ? "bg-[#2B2E33] text-[#F5F6F7]"
                    : "bg-[#F5F6F7] text-[#7B7F85] border border-[#C1C4C8] hover:text-[#2B2E33]"
                }`}
              >
                <Database className="w-4 h-4" />
                PYQ Bank
              </button>
              <button
                onClick={() => setActiveTab("ai")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-colors ${
                  activeTab === "ai"
                    ? "bg-[#2B2E33] text-[#F5F6F7]"
                    : "bg-[#F5F6F7] text-[#7B7F85] border border-[#C1C4C8] hover:text-[#2B2E33]"
                }`}
              >
                <Sparkles className="w-4 h-4" />
                AI Generator
              </button>
            </div>

            {activeTab === "pyq" && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-[#7B7F85] uppercase tracking-wider mb-2">Select Question Paper</label>
                  <select
                    value={selectedPaper || ""}
                    onChange={(e) => e.target.value && fetchPaperQuestions(parseInt(e.target.value))}
                    className="w-full px-4 py-3 bg-[#F5F6F7] border border-[#C1C4C8] rounded-xl text-[#2B2E33] focus:outline-none focus:ring-2 focus:ring-[#2B2E33]/15"
                  >
                    <option value="">Select a question paper...</option>
                    {questionPapers.map((paper) => (
                      <option key={paper.id} value={paper.id}>
                        {paper.title} ({paper.year}) - {paper.subject} - {paper.question_count} questions
                      </option>
                    ))}
                  </select>
                </div>

                {paperQuestions.length > 0 && (
                  <div>
                    <label className="block text-sm font-semibold text-[#7B7F85] uppercase tracking-wider mb-2">Select Questions</label>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {paperQuestions.map((question) => (
                        <div
                          key={question.id}
                          className={`p-4 border rounded-xl cursor-pointer transition-colors ${
                            formData.selectedQuestions.includes(question.id)
                              ? "border-[#2B2E33] bg-[#2B2E33]/10"
                              : "border-[#C1C4C8] bg-[#F5F6F7] hover:border-[#2B2E33]/50"
                          }`}
                          onClick={() => toggleQuestionSelection(question.id)}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-5 h-5 rounded border flex items-center justify-center mt-0.5 ${
                              formData.selectedQuestions.includes(question.id)
                                ? "bg-[#2B2E33] border-[#2B2E33]"
                                : "border-[#C1C4C8]"
                            }`}>
                              {formData.selectedQuestions.includes(question.id) && (
                                <Check className="w-3 h-3 text-[#F5F6F7]" />
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm text-[#2B2E33]">{question.text}</p>
                              <div className="flex gap-2 mt-2">
                                <span className="text-xs px-2 py-1 bg-[#C1C4C8]/30 rounded text-[#7B7F85]">{question.difficulty}</span>
                                <span className="text-xs px-2 py-1 bg-[#C1C4C8]/30 rounded text-[#7B7F85]">{question.subject}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-[#C1C4C8]/20 border border-[#C1C4C8] rounded-xl p-4">
                  <p className="text-[#7B7F85] text-sm font-medium">
                    {formData.selectedQuestions.length} questions selected from question papers
                  </p>
                </div>
              </div>
            )}

            {activeTab === "ai" && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-[#7B7F85] uppercase tracking-wider mb-2">
                    Generate Role-Specific Questions
                  </label>
                  <textarea
                    value={aiDescription}
                    onChange={(e) => setAiDescription(e.target.value)}
                    placeholder="Describe the skills and topics you want to test. The AI will generate relevant technical questions."
                    rows={4}
                    className="w-full px-4 py-3 bg-[#F5F6F7] border border-[#C1C4C8] rounded-xl text-[#2B2E33] placeholder-[#7B7F85] focus:outline-none focus:ring-2 focus:ring-[#2B2E33]/15"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#7B7F85] uppercase tracking-wider mb-2">
                    Number of Questions
                  </label>
                  <input
                    type="number"
                    value={aiQuestionCount}
                    onChange={(e) => setAiQuestionCount(parseInt(e.target.value))}
                    min="1"
                    max="20"
                    className="w-full px-4 py-3 bg-[#F5F6F7] border border-[#C1C4C8] rounded-xl text-[#2B2E33] focus:outline-none focus:ring-2 focus:ring-[#2B2E33]/15"
                  />
                </div>

                <button
                  onClick={generateAIQuestions}
                  disabled={aiGenerating || !aiDescription.trim()}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#2B2E33] hover:bg-[#2B2E33]/90 disabled:bg-[#C1C4C8] disabled:cursor-not-allowed text-[#F5F6F7] rounded-xl font-semibold text-sm transition-colors shadow-sm"
                >
                  {aiGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generate Questions
                    </>
                  )}
                </button>

                {formData.generatedQuestions.length > 0 && (
                  <div>
                    <label className="block text-sm font-semibold text-[#7B7F85] uppercase tracking-wider mb-2">
                      Generated Questions ({formData.generatedQuestions.length})
                    </label>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {formData.generatedQuestions.map((question, index) => (
                        <div key={index} className="p-4 border border-[#C1C4C8] rounded-xl bg-[#F5F6F7]">
                          <p className="text-sm text-[#2B2E33] mb-2">{question.text}</p>
                          <div className="space-y-1">
                            {question.options.map((option: string, optIndex: number) => (
                              <div key={optIndex} className="text-xs text-[#7B7F85] flex items-center gap-2">
                                <span className="font-semibold">{String.fromCharCode(65 + optIndex)}.</span>
                                <span>{option}</span>
                              </div>
                            ))}
                          </div>
                          <div className="flex gap-2 mt-2">
                            <span className="text-xs px-2 py-1 bg-[#C1C4C8]/30 rounded text-[#7B7F85]">{question.difficulty}</span>
                            <span className="text-xs px-2 py-1 bg-[#C1C4C8]/30 rounded text-[#7B7F85]">Correct: {question.correct_answer}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-between mt-8">
              <button
                onClick={prevStep}
                className="flex items-center gap-2 px-6 py-3 border border-[#C1C4C8] bg-[#F5F6F7] hover:bg-[#C1C4C8]/20 text-[#2B2E33] rounded-xl font-semibold transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <button
                onClick={nextStep}
                className="flex items-center gap-2 px-6 py-3 bg-[#2B2E33] hover:bg-[#2B2E33]/90 text-[#F5F6F7] rounded-xl font-semibold transition-colors shadow-sm"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="bg-[#F5F6F7] border border-[#C1C4C8] rounded-2xl p-8 shadow-sm">
            <h2 className="text-xl font-bold text-[#2B2E33] mb-6">Proctoring Enforcement Level</h2>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-[#F5F6F7] border border-[#C1C4C8] rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#2B2E33] flex items-center justify-center">
                    <Eye className="w-5 h-5 text-[#F5F6F7]" />
                  </div>
                  <div>
                    <div className="font-semibold text-[#2B2E33]">Facial & Eye Gaze Tracking</div>
                    <div className="text-sm text-[#7B7F85]">Monitor head movements and gaze direction</div>
                  </div>
                </div>
                <button
                  onClick={() => updateProctoringConfig("facialTracking", !formData.proctoringConfig.facialTracking)}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    formData.proctoringConfig.facialTracking ? "bg-[#2B2E33]" : "bg-[#C1C4C8]"
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-[#F5F6F7] rounded-full transition-transform ${
                      formData.proctoringConfig.facialTracking ? "translate-x-6" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-[#F5F6F7] border border-[#C1C4C8] rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#2B2E33] flex items-center justify-center">
                    <Shield className="w-5 h-5 text-[#F5F6F7]" />
                  </div>
                  <div>
                    <div className="font-semibold text-[#2B2E33]">Browser Tab Lockdown</div>
                    <div className="text-sm text-[#7B7F85]">Prevent switching tabs during assessment</div>
                  </div>
                </div>
                <button
                  onClick={() => updateProctoringConfig("tabLockdown", !formData.proctoringConfig.tabLockdown)}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    formData.proctoringConfig.tabLockdown ? "bg-[#2B2E33]" : "bg-[#C1C4C8]"
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-[#F5F6F7] rounded-full transition-transform ${
                      formData.proctoringConfig.tabLockdown ? "translate-x-6" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-[#F5F6F7] border border-[#C1C4C8] rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#7B7F85] flex items-center justify-center">
                    <Mic className="w-5 h-5 text-[#F5F6F7]" />
                  </div>
                  <div>
                    <div className="font-semibold text-[#2B2E33]">Audio Noise Detection</div>
                    <div className="text-sm text-[#7B7F85]">Detect background noise and conversations</div>
                  </div>
                </div>
                <button
                  onClick={() => updateProctoringConfig("audioDetection", !formData.proctoringConfig.audioDetection)}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    formData.proctoringConfig.audioDetection ? "bg-[#2B2E33]" : "bg-[#C1C4C8]"
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-[#F5F6F7] rounded-full transition-transform ${
                      formData.proctoringConfig.audioDetection ? "translate-x-6" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#7B7F85] uppercase tracking-wider mb-2">Snapshot Interval</label>
                <div className="flex gap-2">
                  {[30, 60].map((interval) => (
                    <button
                      key={interval}
                      onClick={() => updateProctoringConfig("snapshotInterval", interval)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-colors ${
                        formData.proctoringConfig.snapshotInterval === interval
                          ? "bg-[#2B2E33] text-[#F5F6F7]"
                          : "bg-[#F5F6F7] text-[#7B7F85] border border-[#C1C4C8] hover:text-[#2B2E33]"
                      }`}
                    >
                      <Camera className="w-4 h-4" />
                      {interval}s
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-between mt-8">
              <button
                onClick={prevStep}
                className="flex items-center gap-2 px-6 py-3 border border-[#C1C4C8] bg-[#F5F6F7] hover:bg-[#C1C4C8]/20 text-[#2B2E33] rounded-xl font-semibold transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 bg-[#2B2E33] hover:bg-[#2B2E33]/90 disabled:bg-[#C1C4C8] disabled:cursor-not-allowed text-[#F5F6F7] rounded-xl font-semibold transition-colors shadow-sm"
              >
                {loading ? (
                  "Creating..."
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Create Assessment
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

