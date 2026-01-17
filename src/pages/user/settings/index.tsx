// pages/user/settings/index.tsx
import UserLayout from "@/components/user/layout/UserLayout";
import {
  Bell,
  Globe2,
  Lock,
  Mail,
  Moon,
  SunMedium,
  Trash2,
  User,
} from "lucide-react";
import Head from "next/head";
import { FormEvent, useState } from "react";

export default function StudentSettingsPage() {
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);

  const [profile, setProfile] = useState({
    fullName: "Belayet Riad",
    email: "student@example.com",
    jobTitle: "",
    company: "",
    timezone: "America/Los_Angeles",
    language: "en",
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [prefs, setPrefs] = useState({
    emailUpdates: true,
    courseAnnouncements: true,
    marketingEmails: false,
    theme: "system" as "system" | "light" | "dark",
  });

  const onProfileChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setProfile((p) => ({ ...p, [name]: value }));
  };

  const onPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordForm((p) => ({ ...p, [name]: value }));
  };

  const onPrefChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLInputElement>
  ) => {
    const { name, type, checked, value } = e.target;
    if (type === "checkbox") {
      setPrefs((p) => ({ ...p, [name]: checked }));
    } else {
      setPrefs((p) => ({ ...p, [name]: value }));
    }
  };

  const submitProfile = async (e: FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      // TODO: call API: PATCH /user/profile
      await new Promise((res) => setTimeout(res, 600));
    } finally {
      setSavingProfile(false);
    }
  };

  const submitPassword = async (e: FormEvent) => {
    e.preventDefault();
    setSavingPassword(true);
    try {
      // TODO: call API: POST /user/change-password
      await new Promise((res) => setTimeout(res, 600));
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } finally {
      setSavingPassword(false);
    }
  };

  const submitPrefs = async (e: FormEvent) => {
    e.preventDefault();
    setSavingPrefs(true);
    try {
      // TODO: call API: PATCH /user/preferences
      await new Promise((res) => setTimeout(res, 600));
    } finally {
      setSavingPrefs(false);
    }
  };

  return (
    <>
      <Head>
        <title>Settings · Student</title>
      </Head>
      <UserLayout>
        <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">
                Settings
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Manage your profile, security, and notification preferences.
              </p>
            </div>
          </div>

          {/* Profile & account */}
          <form
            onSubmit={submitProfile}
            className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5 space-y-4"
          >
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-full bg-slate-900 text-white flex items-center justify-center text-sm font-semibold">
                {profile.fullName
                  .split(" ")
                  .map((x) => x[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Profile
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  This information will be used on your certificates and within
                  the learning platform.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    name="fullName"
                    value={profile.fullName}
                    onChange={onProfileChange}
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-300"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    name="email"
                    type="email"
                    value={profile.email}
                    onChange={onProfileChange}
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-300"
                    disabled
                  />
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  Email is managed by your account and cannot be changed here.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Role / Title
                </label>
                <input
                  name="jobTitle"
                  value={profile.jobTitle}
                  onChange={onProfileChange}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-300"
                  placeholder="e.g. Sustainability Manager"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Organization
                </label>
                <input
                  name="company"
                  value={profile.company}
                  onChange={onProfileChange}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-300"
                  placeholder="Company / Institution name"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Timezone
                </label>
                <select
                  name="timezone"
                  value={profile.timezone}
                  onChange={onProfileChange}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-300"
                >
                  <option value="America/Los_Angeles">Pacific (US)</option>
                  <option value="America/New_York">Eastern (US)</option>
                  <option value="Europe/London">Europe/London</option>
                  <option value="Asia/Dhaka">Asia/Dhaka</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Language
                </label>
                <div className="relative">
                  <Globe2 className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <select
                    name="language"
                    value={profile.language}
                    onChange={onProfileChange}
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-300"
                  >
                    <option value="en">English</option>
                    <option value="bn">Bengali</option>
                    <option value="fr">French</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={savingProfile}
                className="px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 disabled:opacity-60"
              >
                {savingProfile ? "Saving..." : "Save Profile"}
              </button>
            </div>
          </form>

          {/* Security */}
          <form
            onSubmit={submitPassword}
            className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5 space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-slate-900 text-white flex items-center justify-center">
                <Lock className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Security
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Update your password regularly to keep your account secure.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Current Password
                </label>
                <input
                  name="currentPassword"
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={onPasswordChange}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-300"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  New Password
                </label>
                <input
                  name="newPassword"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={onPasswordChange}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-300"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Confirm New Password
                </label>
                <input
                  name="confirmPassword"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={onPasswordChange}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-300"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <p className="text-[11px] text-slate-400 max-w-sm">
                Password must be at least 8 characters long and include a mix of
                letters and numbers.
              </p>
              <button
                type="submit"
                disabled={savingPassword}
                className="px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 disabled:opacity-60"
              >
                {savingPassword ? "Updating..." : "Update Password"}
              </button>
            </div>
          </form>

          {/* Preferences */}
          <form
            onSubmit={submitPrefs}
            className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5 space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-slate-900 text-white flex items-center justify-center">
                <Bell className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Preferences
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Control notifications, email updates, and appearance.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-slate-700">
                  Email Notifications
                </h3>

                <label className="flex items-start gap-3 text-xs text-slate-600">
                  <input
                    type="checkbox"
                    name="emailUpdates"
                    checked={prefs.emailUpdates}
                    onChange={onPrefChange}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300"
                  />
                  <span>
                    Product updates & platform announcements
                    <span className="block text-[11px] text-slate-400">
                      Be informed when new features or improvements are
                      released.
                    </span>
                  </span>
                </label>

                <label className="flex items-start gap-3 text-xs text-slate-600">
                  <input
                    type="checkbox"
                    name="courseAnnouncements"
                    checked={prefs.courseAnnouncements}
                    onChange={onPrefChange}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300"
                  />
                  <span>
                    Course & assignment reminders
                    <span className="block text-[11px] text-slate-400">
                      Stay on track with reminders for deadlines and new
                      content.
                    </span>
                  </span>
                </label>

                <label className="flex items-start gap-3 text-xs text-slate-600">
                  <input
                    type="checkbox"
                    name="marketingEmails"
                    checked={prefs.marketingEmails}
                    onChange={onPrefChange}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300"
                  />
                  <span>
                    Learning offers & promotions
                    <span className="block text-[11px] text-slate-400">
                      Optional tips, offers, and curated learning paths.
                    </span>
                  </span>
                </label>
              </div>

              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-slate-700">
                  Appearance
                </h3>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setPrefs((p) => ({ ...p, theme: "system" }))}
                    className={`flex flex-col items-center gap-1 rounded-xl border px-3 py-2 ${
                      prefs.theme === "system"
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 bg-slate-50 text-slate-700"
                    }`}
                  >
                    <Globe2 className="h-4 w-4" />
                    System
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrefs((p) => ({ ...p, theme: "light" }))}
                    className={`flex flex-col items-center gap-1 rounded-xl border px-3 py-2 ${
                      prefs.theme === "light"
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 bg-slate-50 text-slate-700"
                    }`}
                  >
                    <SunMedium className="h-4 w-4" />
                    Light
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrefs((p) => ({ ...p, theme: "dark" }))}
                    className={`flex flex-col items-center gap-1 rounded-xl border px-3 py-2 ${
                      prefs.theme === "dark"
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 bg-slate-50 text-slate-700"
                    }`}
                  >
                    <Moon className="h-4 w-4" />
                    Dark
                  </button>
                </div>

                <p className="text-[11px] text-slate-400">
                  Theme changes will apply across your student dashboard. If
                  your browser or OS has dark mode enabled and you select
                  &quot;System&quot;, it will follow that preference.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                className="inline-flex items-center gap-1 text-[11px] text-rose-600 hover:text-rose-700"
                // TODO: open confirm dialog and call API to deactivate/delete
                onClick={() =>
                  alert(
                    "Account deletion flow is not implemented yet. Integrate with backend when ready."
                  )
                }
              >
                <Trash2 className="h-3 w-3" />
                Deactivate / Delete account
              </button>

              <button
                type="submit"
                disabled={savingPrefs}
                className="px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 disabled:opacity-60"
              >
                {savingPrefs ? "Saving..." : "Save Preferences"}
              </button>
            </div>
          </form>
        </div>
      </UserLayout>
    </>
  );
}
