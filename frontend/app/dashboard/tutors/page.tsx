"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Badge, Button, Card, EmptyState, Modal, PageHeader, SkeletonCard } from "@/components/ui";
import { bookTutorSession, getMyTutorSessions, getTutorAvailability, getTutors } from "@/lib/api";
import { useTheme } from "@/contexts/theme-context";
import { useAIInsights } from "@/contexts/ai-insights-context";
import type { TutorAvailability, TutorProfile, TutorSession } from "@/lib/types";
import { Users, Calendar, Clock, Star, Video, Search, Filter, ChevronRight, CheckCircle, XCircle, User, MapPin, Award, Brain, Sparkles, Video as VideoIcon, Zap, Target } from "lucide-react";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const SESSION_STATUS_COLORS: Record<string, string> = {
  scheduled: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
  completed: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
  cancelled: "bg-slate-700/50 text-slate-500 border border-slate-600/50",
};

export default function TutorsPage() {
  const { actualTheme } = useTheme();
  const { insights, generateInsights } = useAIInsights();
  const [tutors, setTutors] = useState<TutorProfile[]>([]);
  const [sessions, setSessions] = useState<TutorSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTutor, setSelectedTutor] = useState<TutorProfile | null>(null);
  const [availability, setAvailability] = useState<TutorAvailability[]>([]);
  const [bookingSlot, setBookingSlot] = useState<TutorAvailability | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"find" | "upcoming">("find");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAIMatching, setShowAIMatching] = useState(true);
  const [viewMode, setViewMode] = useState<"2d" | "3d">("2d");
  const [smartScheduling, setSmartScheduling] = useState(false);

  useEffect(() => {
    Promise.all([getTutors(), getMyTutorSessions()])
      .then(([t, s]) => {
        setTutors(t);
        setSessions(s);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleSelectTutor(tutor: TutorProfile) {
    setSelectedTutor(tutor);
    setAvailability([]);
    try {
      const avail = await getTutorAvailability(tutor.id);
      setAvailability(avail);
    } catch {
      setAvailability([]);
    }
  }

  async function handleBook() {
    if (!selectedTutor || !bookingSlot) return;
    setBookingLoading(true);
    setBookingError(null);

    // Build a scheduled_at from the slot
    const now = new Date();
    const daysUntilNext = (bookingSlot.day_of_week - now.getDay() + 7) % 7 || 7;
    const bookDate = new Date(now);
    bookDate.setDate(bookDate.getDate() + daysUntilNext);
    const [h, m] = bookingSlot.start_time.split(":").map(Number);
    bookDate.setHours(h, m, 0, 0);

    try {
      const session = await bookTutorSession({
        tutor_id: selectedTutor.id,
        scheduled_at: bookDate.toISOString(),
        duration_minutes: 60,
      });
      setSessions((prev) => [session, ...prev]);
      setBookingSlot(null);
      setSelectedTutor(null);
      setActiveTab("upcoming");
    } catch (err) {
      setBookingError(err instanceof Error ? err.message : "Booking failed");
    } finally {
      setBookingLoading(false);
    }
  }

  const upcoming = sessions.filter((s) => s.status === "scheduled");
  const past = sessions.filter((s) => s.status !== "scheduled");
  
  const filteredTutors = tutors.filter(t => 
    !searchQuery || 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.subjects.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen space-y-6">
      {/* Hero Header */}
      <section className="rounded-[24px] border border-[#C1C4C8] bg-gradient-to-br from-[#2B2E33] to-[#7B7F85] p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-6 h-6 text-white/80" />
            <p className="text-sm font-semibold uppercase tracking-[0.32em] text-white/70">Tutor Scheduler</p>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
            AI-Powered Tutor Matching
          </h1>
          <p className="text-lg text-white/90">
            Find expert tutors, view their availability, and book a personalised session.
          </p>
          <div className="flex gap-2 flex-wrap mt-4">
            <button
              onClick={() => setViewMode(viewMode === "2d" ? "3d" : "2d")}
              className="px-4 py-2 rounded-xl font-semibold transition bg-white/10 text-white hover:bg-white/20 flex items-center gap-2"
            >
              <Target className="w-4 h-4" />
              {viewMode === "2d" ? "3D Profiles" : "2D Profiles"}
            </button>
            <button
              onClick={() => setSmartScheduling(!smartScheduling)}
              className="px-4 py-2 rounded-xl font-semibold transition bg-white/10 text-white hover:bg-white/20 flex items-center gap-2"
            >
              <Zap className="w-4 h-4" />
              Smart Schedule
            </button>
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* AI Matching Section */}
      {showAIMatching && (
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[24px] border border-[#C1C4C8] bg-[#F5F6F7] p-6 shadow-lg"
        >
          <div className="flex items-center gap-3 mb-6">
            <Brain className="w-6 h-6 text-[#2B2E33]" />
            <div>
              <h2 className="text-xl font-bold text-[#2B2E33] tracking-tight">AI Tutor Recommendations</h2>
              <p className="text-sm text-[#7B7F85]">Personalized tutor matches based on your learning goals</p>
            </div>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tutors.slice(0, 3).map((tutor, index) => (
              <motion.div
                key={tutor.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 rounded-xl border-2 border-[#2B2E33] bg-[#2B2E33]/10"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#2B2E33] to-[#7B7F85] text-lg font-bold text-[#F5F6F7]">
                    {tutor.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-[#2B2E33]">{tutor.name}</p>
                    <div className="flex items-center gap-1 text-xs text-[#7B7F85]">
                      <Star className="w-3 h-3" />
                      {tutor.rating.toFixed(1)} · {tutor.subjects[0]}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#7B7F85]">
                  <Sparkles className="w-3 h-3" />
                  <span>95% match</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[#C1C4C8]">
        {(["find", "upcoming"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-bold transition border-b-2 -mb-px ${
              activeTab === tab
                ? "border-[#2B2E33] text-[#2B2E33]"
                : "border-transparent text-[#7B7F85] hover:text-[#2B2E33]"
            }`}
          >
            {tab === "find" ? "Find a Tutor" : `My Sessions (${sessions.length})`}
          </button>
        ))}
      </div>

      {activeTab === "find" && (
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#7B7F85]" />
            <input
              type="search"
              placeholder="Search tutors by name or subject..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#C1C4C8] bg-[#F5F6F7] text-[#2B2E33] placeholder-[#7B7F85] focus:outline-none focus:ring-2 focus:ring-[#2B2E33]"
            />
          </div>

          {loading ? (
            <div className="bento-grid">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="bento-item col-span-4 md:col-span-3 lg:col-span-4 shimmer h-64 rounded-2xl" />
              ))}
            </div>
          ) : filteredTutors.length === 0 ? (
            <div className="rounded-[24px] border border-[#C1C4C8] bg-[#F5F6F7] p-12 text-center">
              <div className="flex justify-center mb-4">
                <div className="w-20 h-20 rounded-full bg-[#C1C4C8]/20 flex items-center justify-center">
                  <Users className="w-10 h-10 text-[#7B7F85]" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-[#2B2E33] mb-2">
                {tutors.length === 0 ? "No tutors available" : "No matching tutors"}
              </h3>
              <p className="text-[#7B7F85]">
                {tutors.length === 0 ? "Check back later for available tutors." : "Try adjusting your search criteria."}
              </p>
            </div>
          ) : (
            <div className="bento-grid">
              {filteredTutors.map((tutor, index) => (
                <motion.div
                  key={tutor.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="bento-item col-span-4 md:col-span-3 lg:col-span-4 bg-[#F5F6F7] border border-[#C1C4C8] p-6 shadow-lg hover-lift"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-tobr from-[#2B2E33] to-[#7B7F85] text-xl font-bold text-[#F5F6F7] shadow-lg">
                      {tutor.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-[#2B2E33] tracking-tight">{tutor.name}</h3>
                      {tutor.bio && (
                        <p className="mt-1 text-sm text-[#7B7F85] line-clamp-2">{tutor.bio}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {tutor.subjects.slice(0, 3).map((subject) => (
                      <span
                        key={subject}
                        className="rounded-full bg-[#2B2E33]/10 border border-[#C1C4C8] px-3 py-1 text-xs font-semibold text-[#2B2E33]"
                      >
                        {subject}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-4 text-sm text-[#7B7F85] mb-4">
                    <span className="flex items-center gap-1">
                      <Star className="w-4 h-4" />
                      {tutor.rating.toFixed(1)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Award className="w-4 h-4" />
                      {tutor.total_sessions} sessions
                    </span>
                    <span className="font-bold text-[#2B2E33]">£{tutor.hourly_rate}/hr</span>
                  </div>

                  <Button
                    className="w-full bg-gradient-to-r from-[#2B2E33] to-[#7B7F85] text-white shadow-lg hover:scale-105 transition"
                    onClick={() => handleSelectTutor(tutor)}
                  >
                    View Availability & Book
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "upcoming" && (
        <div className="space-y-6">
          {upcoming.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-4">
                <Calendar className="w-5 h-5 text-[#2B2E33]" />
                <h2 className="text-lg font-bold text-[#2B2E33] tracking-tight">
                  Upcoming Sessions
                </h2>
              </div>
              <div className="space-y-3">
                {upcoming.map((s, index) => (
                  <motion.div
                    key={s.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <SessionRow session={s} />
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {past.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-4">
                <Clock className="w-5 h-5 text-[#7B7F85]" />
                <h2 className="text-lg font-bold text-[#2B2E33] tracking-tight">
                  Past Sessions
                </h2>
              </div>
              <div className="space-y-3">
                {past.map((s, index) => (
                  <motion.div
                    key={s.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <SessionRow session={s} />
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {sessions.length === 0 && (
            <div className="rounded-[24px] border border-[#C1C4C8] bg-[#F5F6F7] p-12 text-center">
              <div className="flex justify-center mb-4">
                <div className="w-20 h-20 rounded-full bg-[#C1C4C8]/20 flex items-center justify-center">
                  <Calendar className="w-10 h-10 text-[#7B7F85]" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-[#2B2E33] mb-2">No sessions booked yet</h3>
              <p className="text-[#7B7F85] mb-6">Find a tutor and book your first session.</p>
              <Button
                onClick={() => setActiveTab("find")}
                className="bg-gradient-to-r from-[#2B2E33] to-[#7B7F85] text-white shadow-lg hover:scale-105 transition"
              >
                Find a Tutor
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Booking Modal */}
      <Modal
        open={!!selectedTutor}
        onClose={() => { setSelectedTutor(null); setBookingSlot(null); setBookingError(null); }}
        title={selectedTutor ? `Book ${selectedTutor.name}` : "Book Session"}
      >
        {selectedTutor && (
          <div className="space-y-4">
            <p className="text-sm text-[#7B7F85]">
              Select an available slot:
            </p>

            {availability.length === 0 ? (
              <p className="text-sm text-[#7B7F85]">No availability slots found.</p>
            ) : (
              <div className="grid gap-2">
                {availability.map((slot) => (
                  <button
                    key={slot.id}
                    type="button"
                    onClick={() => setBookingSlot(slot)}
                    className={`w-full rounded-xl border p-3 text-left text-sm transition-all duration-300 ${
                      bookingSlot?.id === slot.id
                        ? "border-[#2B2E33] bg-[#2B2E33]/10 font-bold text-[#2B2E33] shadow-lg"
                        : "border-[#C1C4C8] bg-[#F5F6F7] hover:border-[#2B2E33] hover:bg-[#2B2E33]/10"
                    }`}
                  >
                    <span className="font-medium">{DAY_NAMES[slot.day_of_week]}</span>
                    {" · "}
                    {slot.start_time} – {slot.end_time}
                  </button>
                ))}
              </div>
            )}

            {bookingError && (
              <p className="text-sm text-red-600">{bookingError}</p>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleBook}
                disabled={!bookingSlot || bookingLoading}
                className="flex-1 bg-gradient-to-r from-[#2B2E33] to-[#7B7F85] text-white shadow-lg hover:scale-105 transition"
              >
                {bookingLoading ? "Booking…" : "Confirm Booking"}
              </Button>
              <Button
                variant="secondary"
                onClick={() => { setSelectedTutor(null); setBookingSlot(null); }}
                className="border border-[#C1C4C8] bg-[#F5F6F7] text-[#2B2E33] hover:bg-[#C1C4C8]/20 transition"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function SessionRow({ session }: { session: TutorSession }) {
  const statusIcon = session.status === "scheduled" ? <Calendar className="w-5 h-5" /> : 
                     session.status === "completed" ? <CheckCircle className="w-5 h-5" /> : 
                     <XCircle className="w-5 h-5" />;

  const statusColor = session.status === "scheduled" ? "text-[#2B2E33]" : 
                       session.status === "completed" ? "text-green-600" : 
                       "text-[#7B7F85]";

  return (
    <div className="flex items-center gap-4 p-4 rounded-xl border border-[#C1C4C8] bg-[#F5F6F7] shadow-sm hover-lift transition-all duration-300">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#2B2E33]/10 text-[#2B2E33] shadow-lg">
        {statusIcon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-[#2B2E33] tracking-tight">
          Session with Tutor #{session.tutor_id}
        </p>
        <p className="text-sm text-[#7B7F85]">
          {new Date(session.scheduled_at).toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
          {" · "}{session.duration_minutes} min
        </p>
      </div>
      <span
        className={`rounded-full px-3 py-1 text-xs font-bold border ${
          session.status === "scheduled" 
            ? "bg-[#2B2E33]/10 border-[#2B2E33] text-[#2B2E33]"
            : session.status === "completed"
              ? "bg-green-50 border-green-200 text-green-700"
              : "bg-[#C1C4C8]/20 border-[#C1C4C8] text-[#7B7F85]"
        }`}
      >
        {session.status}
      </span>
      {session.meeting_link && session.status === "scheduled" && (
        <a
          href={session.meeting_link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#2B2E33] to-[#7B7F85] px-4 py-2 text-xs font-bold text-white shadow-lg hover:scale-105 transition"
        >
          <VideoIcon className="w-4 h-4" />
          Join Video
        </a>
      )}
      {session.status === "completed" && (
        <button className="inline-flex items-center gap-2 rounded-xl border border-[#C1C4C8] bg-[#F5F6F7] px-4 py-2 text-xs font-semibold text-[#2B2E33] hover:bg-[#C1C4C8]/20 transition">
          <VideoIcon className="w-4 h-4" />
          Watch Recording
        </button>
      )}
    </div>
  );
}
