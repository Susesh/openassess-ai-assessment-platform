"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Mail, Lock, CheckCircle, Zap, Flame, Target, Users, Award, Eye, EyeOff } from "lucide-react";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/store/auth.store";
import { ForgotPasswordModal } from "@/components/auth/ForgotPasswordModal";
import { BrandLogo } from "@/components/brand-logo";
import { motion } from "framer-motion";

const handleSocialLogin = (provider: string) => {
  alert(`OAuth providers will be enabled in production. (${provider})`);
};

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  rememberMe: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const features = [
  { icon: Zap, text: "AI Proctoring Active" },
  { icon: Flame, text: "Daily Streaks" },
  { icon: Target, text: "10-Yr PYQ Bank" },
];

const stats = [
  { icon: Users, label: "Students", value: "50K+" },
  { icon: Award, label: "Assessments", value: "100K+" },
  { icon: CheckCircle, label: "Verified", value: "100%" },
];

export default function LoginPage() {
  const router = useRouter();
  const loginStore = useAuthStore((state) => state.login);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  async function onLoginSubmit(values: LoginFormValues) {
    setError(null);
    setIsSubmitting(true);
    try {
      const response = await authService.login(values.email, values.password);
      const token = response.access_token;
      if (typeof window !== "undefined") {
        window.localStorage.setItem("openassess_token", token);
      }
      const user = await authService.getMe();
      loginStore({ id: user.id, full_name: user.full_name, email: user.email, role: user.role }, token);
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex bg-white text-gray-900">
      {/* Left Side - Feature Showcase Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gray-900">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 flex flex-col justify-center items-center p-12 text-white w-full"
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
                <div className="w-12 h-12 rounded-lg bg-gray-700 border border-gray-600 flex items-center justify-center">
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
            <div>
              <div className="mb-6">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome back</h2>
                <p className="text-gray-600">Continue your assessment journey</p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-gray-900 border border-gray-700 rounded-lg flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs">!</span>
                  </div>
                  <p className="text-sm text-white">{error}</p>
                </div>
              )}

              <form className="space-y-4" onSubmit={handleSubmit(onLoginSubmit)}>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-600 uppercase tracking-wider" htmlFor="email">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      id="email"
                      type="email"
                      className="w-full pl-12 pr-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all placeholder-gray-400"
                      placeholder="john@example.com"
                      {...register("email")}
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
                      className="w-full pl-12 pr-12 py-3 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all placeholder-gray-400"
                      placeholder="••••••••"
                      {...register("password")}
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
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      {...register("rememberMe")}
                      className="w-4 h-4 rounded border-gray-300 bg-white text-blue-600 focus:ring-blue-600"
                    />
                    <span className="text-sm text-gray-600">Remember me</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowForgotPasswordModal(true)}
                    className="text-sm font-medium text-gray-900 hover:underline transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign in
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
                  <span className="text-sm font-medium">Google</span>
                </button>
                <button
                  onClick={() => handleSocialLogin('GitHub')}
                  className="bg-white hover:bg-gray-50 border border-gray-300 text-gray-900 rounded-lg px-4 py-3 flex items-center justify-center gap-3 transition-all"
                >
                  <span className="text-sm font-medium">GitHub</span>
                </button>
              </div>

              <p className="mt-6 text-center text-gray-600">
                New here?{" "}
                <Link href="/register" className="font-semibold text-blue-600 hover:underline transition-colors">
                  Create an account
                </Link>
              </p>
            </div>
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
              <span>Encrypted</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={showForgotPasswordModal}
        onClose={() => setShowForgotPasswordModal(false)}
      />
    </div>
  );
}

