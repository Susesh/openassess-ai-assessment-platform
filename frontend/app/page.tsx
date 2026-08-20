"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { DEFAULT_LANDING_STATS, landingService } from "@/services/landing.service";
import type { LandingStats } from "@/services/landing.service";
import { BookOpen, Target, TrendingUp, Users, Zap, Shield, Clock, CheckCircle, ArrowRight, Play, Star } from "lucide-react";

const featureCards = [
  {
    icon: <Target className="w-6 h-6" />,
    title: "Unlimited assessments",
    description: "Create and take as many assessments as needed to build confidence and mastery. Practice makes perfect.",
  },
  {
    icon: <Zap className="w-6 h-6" />,
    title: "AI-powered feedback",
    description: "Turn mistakes into learning moments with guided explanations and personalized remediation pathways.",
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: "Verified portfolio",
    description: "Showcase your growth with a public evidence-backed portfolio of progress and verifiable results.",
  },
  {
    icon: <Clock className="w-6 h-6" />,
    title: "Real-time analytics",
    description: "Track your progress with detailed analytics and insights to identify areas for improvement.",
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: "Collaborative learning",
    description: "Learn with peers through shared assessments, discussions, and collaborative study groups.",
  },
  {
    icon: <TrendingUp className="w-6 h-6" />,
    title: "Adaptive difficulty",
    description: "Questions adapt to your skill level, ensuring optimal challenge and continuous growth.",
  },
];

const howItWorks = [
  {
    step: "01",
    title: "Choose Your Topic",
    description: "Browse our extensive library of subjects and topics across CBSE, ICSE, JEE, NEET, UPSC, and more.",
  },
  {
    step: "02",
    title: "Take Assessments",
    description: "Practice with real question papers, AI-generated questions, or create custom assessments.",
  },
  {
    step: "03",
    title: "Get Instant Feedback",
    description: "Receive detailed explanations, performance analytics, and personalized improvement suggestions.",
  },
  {
    step: "04",
    title: "Track & Improve",
    description: "Monitor your progress, identify weak areas, and master topics through targeted practice.",
  },
];

const testimonials = [
  {
    name: "Priya Sharma",
    role: "JEE Aspirant",
    content: "OpenAssess helped me improve my physics score from 60% to 85% in just 2 months. The AI feedback is incredibly helpful!",
    rating: 5,
  },
  {
    name: "Rahul Kumar",
    role: "UPSC Candidate",
    content: "The question paper database is comprehensive. Being able to practice with actual previous year papers made a huge difference.",
    rating: 5,
  },
  {
    name: "Ananya Patel",
    role: "CBSE Class 12",
    content: "I love how I can track my progress across all subjects. The analytics helped me focus on my weak areas before boards.",
    rating: 5,
  },
];

const faqs = [
  {
    question: "Is OpenAssess free to use?",
    answer: "Yes, OpenAssess offers a free tier with access to basic assessments and analytics. Premium plans provide advanced features like AI-powered feedback and unlimited assessments.",
  },
  {
    question: "What exam boards are covered?",
    answer: "We cover CBSE, ICSE, Karnataka State Board, IIT-JEE, NEET, UPSC, and various university entrance exams. Our library is constantly expanding.",
  },
  {
    question: "How does the AI feedback work?",
    answer: "Our AI analyzes your responses, identifies patterns in your mistakes, and provides personalized explanations and study recommendations based on your performance.",
  },
  {
    question: "Can I create my own assessments?",
    answer: "Yes, premium users can create custom assessments by selecting topics, difficulty levels, and question types. You can also share assessments with peers.",
  },
];

export default function LandingPage() {
  const [stats, setStats] = useState<LandingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setError(null);
        const data = await landingService.getStats();
        setStats(data);
      } catch (error) {
        console.error("Failed to fetch stats:", error);
        setError("Unable to load statistics");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const displayStats = stats || DEFAULT_LANDING_STATS;

  return (
    <main className="min-h-screen bg-white text-gray-900">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <BrandLogo subtitle="Continuous assessment platform" />
            <nav className="hidden items-center gap-8 text-sm font-medium text-gray-600 md:flex">
              <a href="#features" className="hover:text-gray-900 transition-colors">
                Features
              </a>
              <a href="#how-it-works" className="hover:text-gray-900 transition-colors">
                How it works
              </a>
              <a href="#testimonials" className="hover:text-gray-900 transition-colors">
                Testimonials
              </a>
              <a href="#faq" className="hover:text-gray-900 transition-colors">
                FAQ
              </a>
            </nav>
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-semibold text-gray-900 hover:text-gray-700 transition-colors"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 text-blue-700 text-sm font-medium mb-6">
                <Star className="w-4 h-4 fill-current" />
                <span>Trusted by 10,000+ learners</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
                Master Your Knowledge with{" "}
                <span className="text-blue-600">Data-Driven Assessments</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Practice. Analyze. Improve. Repeat. OpenAssess helps learners practice continuously, get instant feedback, and showcase measurable growth with confidence.
              </p>
              <div className="flex flex-wrap gap-4 mb-8">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 px-6 py-3 text-base font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  Start Free Trial
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 px-6 py-3 text-base font-semibold text-gray-900 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <Play className="w-5 h-5" />
                  Watch Demo
                </Link>
              </div>
              <div className="flex items-center gap-6 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Cancel anytime</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wider text-gray-500">
                    Community momentum
                  </p>
                  <p className="mt-1 text-3xl font-bold text-gray-900">
                    {loading ? "—" : displayStats.total_users.toLocaleString()} learners
                  </p>
                </div>
                <div className="px-3 py-1.5 rounded-full bg-green-100 text-green-700 text-sm font-medium">
                  {error ? "Stats offline" : "Live stats"}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  { label: "Topics", value: displayStats.total_topics },
                  { label: "Questions", value: displayStats.total_questions },
                  { label: "Attempts", value: displayStats.total_attempts },
                ].map((item) => (
                  <div key={item.label} className="bg-gray-50 rounded-lg p-4">
                    <p className="text-2xl font-bold text-gray-900">
                      {loading ? "—" : item.value.toLocaleString()}
                    </p>
                    <p className="mt-1 text-sm text-gray-600">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-gray-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Everything you need to succeed
            </h2>
            <p className="text-lg text-gray-600">
              Comprehensive tools and features designed to help you master any subject through continuous assessment and intelligent feedback.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {featureCards.map((feature, index) => (
              <div key={index} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              How it works
            </h2>
            <p className="text-lg text-gray-600">
              Get started in minutes and transform your learning journey with our simple 4-step process.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {howItWorks.map((step, index) => (
              <div key={index} className="relative">
                <div className="text-6xl font-bold text-blue-100 mb-4">{step.step}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-600 leading-relaxed">{step.description}</p>
                {index < howItWorks.length - 1 && (
                  <div className="hidden lg:block absolute top-8 right-0 w-full h-0.5 bg-gradient-to-r from-blue-200 to-transparent" style={{ right: '-50%' }}></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="bg-gradient-to-br from-blue-50 to-purple-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Loved by learners everywhere
            </h2>
            <p className="text-lg text-gray-600">
              Join thousands of students who have transformed their learning with OpenAssess.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 leading-relaxed">"{testimonial.content}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{testimonial.name}</p>
                    <p className="text-sm text-gray-600">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="bg-white py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Frequently asked questions
            </h2>
            <p className="text-lg text-gray-600">
              Everything you need to know about OpenAssess.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                <details className="group">
                  <summary className="flex items-center justify-between p-6 cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                    <h3 className="font-semibold text-gray-900">{faq.question}</h3>
                    <ArrowRight className="w-5 h-5 text-gray-500 group-open:rotate-90 transition-transform" />
                  </summary>
                  <div className="p-6 bg-white">
                    <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                  </div>
                </details>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gray-900 py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Ready to transform your learning?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Join thousands of learners who are already mastering their subjects with OpenAssess.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-8 py-4 text-base font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              Get Started Free
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-8 py-4 text-base font-semibold text-gray-900 bg-white hover:bg-gray-100 rounded-lg transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <BrandLogo subtitle="" />
              <p className="mt-4 text-gray-400 text-sm">
                Master your knowledge with data-driven assessments and AI-powered feedback.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Question Papers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Cookie Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-800 text-center text-gray-400 text-sm">
            <p>&copy; 2026 OpenAssess. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
