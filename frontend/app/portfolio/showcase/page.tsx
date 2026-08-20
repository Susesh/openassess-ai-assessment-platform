"use client";

import { useState } from "react";
import { Play, Star, Clock, Eye, Share2, Download, Filter, TrendingUp, Award, BookOpen } from "lucide-react";

interface VideoHighlight {
  id: string;
  title: string;
  question: string;
  topic: string;
  duration: string;
  thumbnail: string;
  views: number;
  rating: number;
  date: string;
  description: string;
  skills: string[];
}

export default function VideoShowcasePage() {
  const [selectedVideo, setSelectedVideo] = useState<VideoHighlight | null>(null);
  const [filter, setFilter] = useState<"all" | "recent" | "popular">("all");

  // Sample video highlights data
  const [highlights] = useState<VideoHighlight[]>([
    {
      id: "1",
      title: "Calculus Integration Explained",
      question: "Explain the concept of definite integration using the fundamental theorem of calculus",
      topic: "Mathematics",
      duration: "3:45",
      thumbnail: "/api/placeholder/400/300",
      views: 1247,
      rating: 4.8,
      date: "2024-01-20",
      description: "Detailed explanation of integration concepts with real-world applications",
      skills: ["Problem Solving", "Mathematical Reasoning", "Communication"],
    },
    {
      id: "2",
      title: "Physics: Newton's Laws",
      question: "Derive the three laws of motion and explain their practical applications",
      topic: "Physics",
      duration: "4:20",
      thumbnail: "/api/placeholder/400/300",
      views: 892,
      rating: 4.6,
      date: "2024-02-15",
      description: "Comprehensive breakdown of Newton's laws with experimental demonstrations",
      skills: ["Experimental Design", "Critical Analysis", "Teaching"],
    },
    {
      id: "3",
      title: "Chemistry: Organic Reactions",
      question: "Explain the mechanism of nucleophilic substitution reactions",
      topic: "Chemistry",
      duration: "5:10",
      thumbnail: "/api/placeholder/400/300",
      views: 654,
      rating: 4.9,
      date: "2024-03-08",
      description: "Step-by-step mechanism explanation with electron-pushing diagrams",
      skills: ["Chemical Analysis", "Research Methods", "Visualization"],
    },
    {
      id: "4",
      title: "Data Structures: Binary Trees",
      question: "Explain tree traversal algorithms and their time complexity",
      topic: "Computer Science",
      duration: "6:30",
      thumbnail: "/api/placeholder/400/300",
      views: 2103,
      rating: 4.9,
      date: "2024-04-02",
      description: "In-depth explanation of tree traversals with code examples",
      skills: ["Programming", "Algorithm Design", "System Architecture"],
    },
    {
      id: "5",
      title: "Statistics: Probability Distributions",
      question: "Explain normal distribution and its applications in real-world scenarios",
      topic: "Statistics",
      duration: "4:15",
      thumbnail: "/api/placeholder/400/300",
      views: 567,
      rating: 4.5,
      date: "2024-04-18",
      description: "Practical applications of probability distributions in data analysis",
      skills: ["Data Analysis", "Statistical Modeling", "Research"],
    },
  ]);

  const filteredHighlights = highlights.filter((video) => {
    if (filter === "all") return true;
    if (filter === "recent") {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return new Date(video.date) >= thirtyDaysAgo;
    }
    if (filter === "popular") return video.views > 1000;
    return true;
  });

  const totalViews = highlights.reduce((sum, video) => sum + video.views, 0);
  const avgRating = (highlights.reduce((sum, video) => sum + video.rating, 0) / highlights.length).toFixed(1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="border-b border-slate-800/50 bg-slate-900/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Video Highlight Reel</h1>
              <p className="text-slate-400">
                Showcase your mastery through recorded explanations
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors">
                <Upload className="w-4 h-4" />
                Upload New
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-800/50 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                  <Play className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{highlights.length}</div>
                  <div className="text-sm text-slate-400">Total Videos</div>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <Eye className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{totalViews.toLocaleString()}</div>
                  <div className="text-sm text-slate-400">Total Views</div>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Star className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{avgRating}</div>
                  <div className="text-sm text-slate-400">Avg Rating</div>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">+23%</div>
                  <div className="text-sm text-slate-400">This Month</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Filter Bar */}
        <div className="flex items-center gap-4 mb-8">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-400">Filter:</span>
          </div>
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === "all"
                ? "bg-indigo-600 text-white"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter("recent")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === "recent"
                ? "bg-indigo-600 text-white"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            Recent
          </button>
          <button
            onClick={() => setFilter("popular")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === "popular"
                ? "bg-indigo-600 text-white"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            Popular
          </button>
        </div>

        {/* Video Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredHighlights.map((video) => (
            <div
              key={video.id}
              onClick={() => setSelectedVideo(video)}
              className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl overflow-hidden hover:border-indigo-500/30 transition-all cursor-pointer group"
            >
              {/* Thumbnail */}
              <div className="relative aspect-video bg-slate-950">
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Play className="w-6 h-6 text-white ml-1" />
                  </div>
                </div>
                <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/70 backdrop-blur-sm rounded text-xs text-white">
                  {video.duration}
                </div>
                <div className="absolute top-3 left-3 px-2 py-1 bg-indigo-600/90 backdrop-blur-sm rounded text-xs text-white font-medium">
                  {video.topic}
                </div>
              </div>

              {/* Video Info */}
              <div className="p-4">
                <h3 className="font-semibold text-white mb-2 line-clamp-2">
                  {video.title}
                </h3>
                <p className="text-sm text-slate-400 mb-3 line-clamp-2">
                  {video.question}
                </p>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-slate-400">
                      <Eye className="w-4 h-4" />
                      <span>{video.views}</span>
                    </div>
                    <div className="flex items-center gap-1 text-amber-400">
                      <Star className="w-4 h-4 fill-current" />
                      <span>{video.rating}</span>
                    </div>
                  </div>
                  <div className="text-slate-500">
                    {new Date(video.date).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Video Detail Modal */}
        {selectedVideo && (
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-6"
            onClick={() => setSelectedVideo(null)}
          >
            <div
              className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Video Player */}
              <div className="relative aspect-video bg-slate-950">
                <img
                  src={selectedVideo.thumbnail}
                  alt={selectedVideo.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:scale-110 transition-transform cursor-pointer">
                    <Play className="w-8 h-8 text-white ml-1" />
                  </div>
                </div>
                <button
                  onClick={() => setSelectedVideo(null)}
                  className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 rounded-lg transition-colors"
                >
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Video Details */}
              <div className="p-8">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 bg-indigo-500/10 text-indigo-400 rounded text-xs font-medium">
                        {selectedVideo.topic}
                      </span>
                      <div className="flex items-center gap-1 text-amber-400">
                        <Star className="w-4 h-4 fill-current" />
                        <span className="font-medium">{selectedVideo.rating}</span>
                      </div>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">
                      {selectedVideo.title}
                    </h2>
                    <p className="text-slate-400">{selectedVideo.description}</p>
                  </div>
                </div>

                {/* Question */}
                <div className="bg-slate-800/50 rounded-xl p-4 mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen className="w-4 h-4 text-indigo-400" />
                    <span className="text-sm font-medium text-slate-400">Question Addressed</span>
                  </div>
                  <p className="text-white">{selectedVideo.question}</p>
                </div>

                {/* Skills */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Award className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm font-medium text-slate-400">Skills Demonstrated</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedVideo.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-sm text-emerald-400"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-white">{selectedVideo.views}</div>
                    <div className="text-xs text-slate-400">Views</div>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-white">{selectedVideo.duration}</div>
                    <div className="text-xs text-slate-400">Duration</div>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-white">
                      {new Date(selectedVideo.date).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-slate-400">Uploaded</div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3">
                  <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors">
                    <Share2 className="w-4 h-4" />
                    Share with Employers
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors">
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Upload({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
      />
    </svg>
  );
}
