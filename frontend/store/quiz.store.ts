import { create } from "zustand";
import type { QuizQuestion } from "@/types/quiz.types";

type QuizState = {
  questions: QuizQuestion[];
  currentIndex: number;
  answers: Record<string, string>;
  attemptId: string | null;
  topicId: string | null;
  isSubmitting: boolean;
  timeSpent: number;
  setQuestions: (questions: QuizQuestion[]) => void;
  selectAnswer: (questionId: string, selectedOption: string) => void;
  nextQuestion: () => void;
  prevQuestion: () => void;
  setAttemptId: (attemptId: string | null) => void;
  setTopicId: (topicId: string | null) => void;
  reset: () => void;
  setIsSubmitting: (value: boolean) => void;
  setTimeSpent: (value: number) => void;
};

export const useQuizStore = create<QuizState>((set) => ({
  questions: [],
  currentIndex: 0,
  answers: {},
  attemptId: null,
  topicId: null,
  isSubmitting: false,
  timeSpent: 0,
  setQuestions: (questions) => set({ questions, currentIndex: 0, answers: {} }),
  selectAnswer: (questionId, selectedOption) =>
    set((state) => ({ answers: { ...state.answers, [questionId]: selectedOption } })),
  nextQuestion: () =>
    set((state) => ({ currentIndex: Math.min(state.questions.length - 1, state.currentIndex + 1) })),
  prevQuestion: () => set((state) => ({ currentIndex: Math.max(0, state.currentIndex - 1) })),
  setAttemptId: (attemptId) => set({ attemptId }),
  setTopicId: (topicId) => set({ topicId }),
  reset: () => set({ questions: [], currentIndex: 0, answers: {}, attemptId: null, topicId: null, isSubmitting: false, timeSpent: 0 }),
  setIsSubmitting: (value) => set({ isSubmitting: value }),
  setTimeSpent: (value) => set({ timeSpent: value }),
}));
