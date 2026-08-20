"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Sparkles, Zap, Shield, CheckCircle, ArrowRight, Mail, Lock, User, Target, Flame, Users, Award, Eye, EyeOff } from "lucide-react";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/store/auth.store";
import { BrandLogo } from "@/components/brand-logo";
import { motion } from "framer-motion";

const handleSocialLogin = (provider: string) => {
  alert(`OAuth providers will be enabled in production. (${provider})`);
};

const schema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  email: z.string().email("Enter a valid email"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[0-9]/, "Password must contain at least one number"),
  role: z.string().min(1, "Role is required"),
  consent: z.boolean().refine((val) => val === true, "You must agree to the terms and conditions"),
});

type FormValues = z.infer<typeof schema>;

const features = [
  { icon: Zap, text: "AI Proctoring Active", color: "from-amber-400 to-orange-500" },
  { icon: Flame, text: "Daily Streaks", color: "from-red-400 to-pink-500" },
  { icon: Target, text: "10-Yr PYQ Bank", color: "from-emerald-400 to-teal-500" },
];

const stats = [
  { icon: Users, label: "Students", value: "50K+" },
  { icon: Award, label: "Assessments", value: "100K+" },
  { icon: Shield, label: "Verified", value: "100%" },
];

export default function RegisterPage() {
  const router = useRouter();
  const loginStore = useAuthStore((state) => state.login);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { register: registerField, handleSubmit, formState: { errors } } = useForm<FormValues>({ 
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      role: "student",
      consent: false,
    }
  });

  async function onSubmit(values: FormValues) {
    setError(null);
    setIsSubmitting(true);
    try {
      const fullName = `${values.firstName} ${values.lastName}`;
      console.log("Attempting registration with:", { fullName, email: values.email, role: values.role });
      
      // Step 1: Register the user
      const user = await authService.register(fullName, values.email, values.password, values.role);
      console.log("Registration successful:", user);
      
      // Step 2: Login to get token
      const response = await authService.login(values.email, values.password);
      const token = response.access_token;
      console.log("Login successful, token received");
      
      // Step 3: Store token and update auth store
      if (typeof window !== "undefined") {
        window.localStorage.setItem("openassess_token", token);
      }
      loginStore({ id: user.id, full_name: user.full_name, email: user.email, role: user.role }, token);
      
      // Step 4: Navigate to dashboard
      router.replace("/dashboard");
    } catch (err: any) {
      console.error("Registration error:", err);
      
      // Enhanced error handling with specific messages
      let errorMessage = "Registration failed. Please try again.";
      
      if (err?.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      } else if (err?.message) {
        errorMessage = err.message;
      } else if (err?.response?.status === 400) {
        errorMessage = "Invalid input data. Please check your information.";
      } else if (err?.response?.status === 409) {
        errorMessage = "Email already registered. Please use a different email or login.";
      } else if (err?.response?.status === 500) {
        errorMessage = "Server error. Please try again later.";
      }
      
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex bg-white text-gray-900">
      {/* Left Side - Feature Showcase Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gray-900">
        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 flex flex-col justify-center items-center p-12 text-white"
        >
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <BrandLogo href="/" dark />
            </div>
            <p className="text-xl text-gray-300 mb-12">The future of assessment is here</p>
          </div>

          {/* Floating Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="space-y-6 w-full max-w-md mb-12"
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
                className="flex items-center gap-4 bg-gray-800 border border-gray-700 rounded-lg p-4 text-white"
              >
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${feature.color} flex items-center justify-center`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <span className="font-medium text-lg text-white">{feature.text}</span>
              </motion.div>
            ))}
          </motion.div>

          {/* Success Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="grid grid-cols-3 gap-4 w-full max-w-md"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.5 + index * 0.1 }}
                className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-center"
              >
                <stat.icon className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-xs text-gray-400">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>

          {/* Gamification Teaser */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mt-8 bg-gray-800 border border-gray-700 rounded-lg p-4"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-red-500">
                <Flame className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">Join 10,000+ students</p>
                <p className="text-xs text-gray-400">Building their daily streaks</p>
              </div>
            </div>
            <div className="mt-3 h-2 bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full w-3/4 bg-gradient-to-r from-orange-500 to-red-500 rounded-full animate-pulse" />
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-gray-50">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="w-full max-w-md"
        >
          <div className="bg-white rounded-lg p-6 sm:p-8 shadow-lg border border-gray-200">
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Create account</h2>
              <p className="text-gray-600">Join thousands of students acing their exams</p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs">!</span>
                </div>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-600 uppercase tracking-wider" htmlFor="firstName">First name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      id="firstName"
                      autoComplete="off"
                      className="w-full pl-12 pr-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all placeholder-gray-400"
                      placeholder="John"
                      {...registerField("firstName")}
                    />
                  </div>
                  {errors.firstName && (
                    <p className="mt-1 text-sm text-gray-600">
                      {errors.firstName.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-600 uppercase tracking-wider" htmlFor="lastName">Last name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      id="lastName"
                      autoComplete="off"
                      className="w-full pl-12 pr-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all placeholder-gray-400"
                      placeholder="Doe"
                      {...registerField("lastName")}
                    />
                  </div>
                  {errors.lastName && (
                    <p className="mt-1 text-sm text-gray-600">
                      {errors.lastName.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-600 uppercase tracking-wider" htmlFor="email">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    autoComplete="off"
                    className="w-full pl-12 pr-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all placeholder-gray-400"
                    placeholder="john@example.com"
                    {...registerField("email")}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-gray-600">
                    {errors.email.message}
                  </p>
                  )}
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-600 uppercase tracking-wider" htmlFor="password">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    className="w-full pl-12 pr-12 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all placeholder-gray-400"
                    placeholder="••••••••"
                    {...registerField("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-gray-600">
                    {errors.password.message}
                  </p>
                )}
                <div className="mt-2 text-xs text-gray-500">
                  Must be at least 8 characters with at least one number
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-600 uppercase tracking-wider" htmlFor="role">Role</label>
                <select
                  id="role"
                  {...registerField("role")}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all"
                >
                  <option value="student">Student</option>
                  <option value="tutor">Tutor</option>
                  <option value="employer">Employer</option>
                  <option value="university">University</option>
                  <option value="admin">Admin</option>
                </select>
                {errors.role && (
                  <p className="mt-1 text-sm text-gray-600">
                    {errors.role.message}
                  </p>
                )}
              </div>

              <div>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    {...registerField("consent")}
                    className="w-4 h-4 mt-1 rounded border-gray-300 bg-white text-blue-600 focus:ring-blue-600 focus:ring-offset-0"
                  />
                  <span className="text-sm text-gray-600">
                    I agree to the <Link href="/terms" className="text-blue-600 hover:text-blue-700 underline">Terms of Service</Link> and <Link href="/privacy" className="text-blue-600 hover:text-blue-700 underline">Privacy Policy</Link>
                  </span>
                </label>
                {errors.consent && (
                  <p className="mt-1 text-sm text-gray-600">
                    {errors.consent.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    Create account
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            {/* Social Login Divider */}
            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500 uppercase tracking-wide">Or continue with</span>
              </div>
            </div>

            {/* Social Login Buttons */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleSocialLogin('Google')}
                className="bg-white hover:bg-gray-50 border border-gray-300 text-gray-900 rounded-lg px-4 py-3 flex items-center justify-center gap-3 transition-all"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span className="text-sm font-medium">Google</span>
              </button>
              <button
                onClick={() => handleSocialLogin('GitHub')}
                className="bg-white hover:bg-gray-50 border border-gray-300 text-gray-900 rounded-lg px-4 py-3 flex items-center justify-center gap-3 transition-all"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
                </svg>
                <span className="text-sm font-medium">GitHub</span>
              </button>
            </div>

            <p className="mt-6 text-center text-gray-600">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                Sign in
              </Link>
            </p>
          </div>

          {/* Trust Badges */}
          <div className="mt-6 flex items-center justify-center gap-6 text-gray-500 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-gray-500" />
              <span>Secure</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-gray-500" />
              <span>Private</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-gray-500" />
              <span>Free forever</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
