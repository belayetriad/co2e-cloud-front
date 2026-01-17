import AdminLayout from "@/components/admin/layout/AdminLayout";
import apiRequest from "@/lib/axios";
import { Loader2, Save } from "lucide-react";
import Head from "next/head";
import { useRouter } from "next/router";
import { useState } from "react";

type FormState = {
  title: string;
  slug: string;
  subtitle: string;
  description: string;
  thumbnailUrl: string; // <-- URL string per API
  isPublished: boolean;
};

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function NewUser() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>({
    title: "",
    slug: "",
    subtitle: "",
    description: "",
    thumbnailUrl: "",
    isPublished: true,
  });

  const onChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    if (type === "checkbox") {
      setForm((f) => ({ ...f, [name]: checked }));
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
  };

  const onTitleBlur = () => {
    if (!form.slug && form.title) {
      setForm((f) => ({ ...f, slug: slugify(f.title) }));
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        slug: form.slug || slugify(form.title),
        subtitle: form.subtitle,
        description: form.description,
        // thumbnailUrl: form.thumbnailUrl, // URL string
        isPublished: form.isPublished, // boolean
      };

      await apiRequest.post("/users", payload); // JSON by default

      router.push("/admin/users");
    } catch (err) {
      console.error(err);
      // TODO: toast
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Head>
        <title>New User · Admin</title>
      </Head>
      <AdminLayout>
        <form
          onSubmit={submit}
          className="max-w-3xl mx-auto space-y-6 bg-white dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-2xl p-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 dark:text-neutral-400 mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                name="title"
                value={form.title}
                onChange={onChange}
                onBlur={onTitleBlur}
                required
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 dark:text-neutral-400 mb-1">
                Slug
              </label>
              <input
                name="slug"
                value={form.slug}
                onChange={onChange}
                placeholder="auto-generated on title blur"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm text-gray-600 dark:text-neutral-400 mb-1">
                Subtitle
              </label>
              <input
                name="subtitle"
                value={form.subtitle}
                onChange={onChange}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-600 dark:text-neutral-400 mb-1">
              Description
            </label>
            <textarea
              name="description"
              rows={6}
              value={form.description}
              onChange={onChange}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 dark:text-neutral-400 mb-1">
              Thumbnail URL
            </label>
            <input
              type="url"
              name="thumbnailUrl"
              placeholder="https://…/image.jpg"
              value={form.thumbnailUrl}
              onChange={onChange}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              id="isPublished"
              type="checkbox"
              name="isPublished"
              checked={form.isPublished}
              onChange={onChange}
              className="h-4 w-4 rounded border-gray-300 dark:border-neutral-700"
            />
            <label
              htmlFor="isPublished"
              className="text-sm text-gray-700 dark:text-neutral-300"
            >
              Published
            </label>
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => router.push("/admin/courses/categories")}
              className="px-4 py-2 rounded-lg border border-gray-200 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
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
