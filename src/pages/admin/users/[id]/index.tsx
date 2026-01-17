// pages/admin/users/[id].tsx
import AdminLayout from "@/components/admin/layout/AdminLayout";
import apiRequest from "@/lib/axios";
import { Loader2, Save } from "lucide-react";
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useMemo, useRef, useState } from "react";

type FormState = {
  firstName: string;
  lastName: string;
  email: string;
  role: "user" | "admin" | "instructor";
  isActive: boolean;
};

export default function EditStudent() {
  const router = useRouter();
  const { id } = router.query as { id?: string };

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>({
    firstName: "",
    lastName: "",
    email: "",
    role: "user",
    isActive: true,
  });
  const originalRef = useRef<FormState | null>(null);

  // Fetch existing user
  useEffect(() => {
    if (!id) return;
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const { data } = await apiRequest.get(`/users/${id}`);
        const next: FormState = {
          firstName: data.firstName ?? "",
          lastName: data.lastName ?? "",
          email: data.email ?? "",
          role: (data.role as FormState["role"]) ?? "user",
          isActive: Boolean(data.isActive),
        };
        if (mounted) {
          setForm(next);
          originalRef.current = next;
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  const onChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const isDirty = useMemo(() => {
    const base = originalRef.current;
    if (!base) return false;
    return (
      base.firstName !== form.firstName ||
      base.lastName !== form.lastName ||
      base.email !== form.email ||
      base.role !== form.role ||
      base.isActive !== form.isActive
    );
  }, [form]);

  const resetChanges = () => {
    if (originalRef.current) setForm(originalRef.current);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSaving(true);
    try {
      const payload = {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        role: form.role,
        isActive: form.isActive,
      };
      await apiRequest.patch(`/users/${id}`, payload);
      originalRef.current = payload;
      setForm(payload);
      if (form?.role == "admin") {
        router.push("/admin/users/admins");
      } else if (form.role == "instructor") {
        router.push("/admin/usersadmins");
      }
      router.push("/admin/users/students");
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <Head>
          <title>Edit User · Admin</title>
        </Head>
        <AdminLayout>
          <div className="max-w-3xl mx-auto p-8">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-neutral-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading user...
            </div>
          </div>
        </AdminLayout>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Edit {form?.role.toUpperCase()} · Admin</title>
      </Head>
      <AdminLayout>
        <form
          onSubmit={submit}
          className="max-w-3xl mx-auto space-y-6 bg-white dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold">
              Edit {form?.role.toUpperCase()}
            </h1>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={resetChanges}
                disabled={!isDirty}
                className="px-3 py-2 rounded-lg border border-gray-200 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-800 disabled:opacity-60"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="px-3 py-2 rounded-lg border border-gray-200 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-800"
              >
                Back
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 dark:text-neutral-400 mb-1">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                name="firstName"
                value={form.firstName}
                onChange={onChange}
                required
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 dark:text-neutral-400 mb-1">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                name="lastName"
                value={form.lastName}
                onChange={onChange}
                required
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm text-gray-600 dark:text-neutral-400 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={onChange}
                required
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 dark:text-neutral-400 mb-1">
                Role
              </label>
              <select
                name="role"
                value={form.role}
                onChange={onChange}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="user">Student</option>
                <option value="instructor">Instructor</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <input
                id="isActive"
                type="checkbox"
                name="isActive"
                checked={form.isActive}
                onChange={onChange}
                className="h-4 w-4 rounded border-gray-300 dark:border-neutral-700"
              />
              <label
                htmlFor="isActive"
                className="text-sm text-gray-700 dark:text-neutral-300"
              >
                Active
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="submit"
              disabled={saving || !isDirty}
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-neutral-700 rounded-lg bg-primary text-black hover:opacity-90 disabled:opacity-60"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save
            </button>
          </div>
        </form>
      </AdminLayout>
    </>
  );
}
