import { Lock, LogIn, Mail } from "lucide-react";
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getCurrentUser } from "../utils/token";

export default function Index() {
  const router = useRouter();
  const { login, isAuthenticated } = useAuth();

  const [form, setForm] = useState({ email: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (isAuthenticated && currentUser) {
      if (currentUser.role == "admin") {
        router.push("/admin");
      } else {
        router.push("/user");
      }
    }
  }, [isAuthenticated, router]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);

    if (!form.email || !form.password) {
      setErr("Email and password are required.");
      return;
    }

    setLoading(true);
    login(form)
      .then((res) => {
        // console.log(res);
      })
      .catch((error) => {
        console.log(error);

        const data = error?.response?.data;

        const msg =
          (Array.isArray(data?.message)
            ? data.message.join(", ")
            : data?.message) ||
          data?.error ||
          error?.message ||
          "Authentication failed. Please try again.";

        setErr(String(msg));
      })
      .finally(() => {
        setLoading(false);
      });
  };
  return (
    <>
      <Head>
        <title>Sign in • CO2e Cloud Admin</title>
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800">
            <div className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-xl bg-indigo-600 dark:bg-indigo-500 grid place-items-center">
                  <LogIn className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                    Welcome back
                  </h1>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Sign in to manage your CO2e Cloud
                  </p>
                </div>
              </div>

              <form onSubmit={onSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Email
                  </label>
                  <div className="mt-1 relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, email: e.target.value }))
                      }
                      className="w-full pl-10 rounded-xl border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
                      placeholder="admin@gmail.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Password
                  </label>
                  <div className="mt-1 relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type={showPw ? "text" : "password"}
                      required
                      value={form.password}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, password: e.target.value }))
                      }
                      className="w-full pl-10 pr-10 rounded-xl border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((p) => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-xs"
                    >
                      {showPw ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                {err && (
                  <div className="text-sm text-rose-600 bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800 rounded-lg p-2">
                    {err}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-indigo-600 text-white py-2.5 font-medium hover:bg-indigo-700 disabled:opacity-60"
                >
                  {loading ? "Signing in…" : "Sign in"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
