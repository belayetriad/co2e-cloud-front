import apiRequest from "@/lib/axios";
import React, { ChangeEvent, useState } from "react";

type FileType = "image" | "video" | "audio" | "document";

interface FileUploaderProps {
  label?: string;
  name: string;
  /** Uploaded file URL or URLs (from backend) */
  value?: string | string[] | null;
  /**
   * Called when upload succeeded or cleared.
   * - single mode => string | null
   * - multiple mode => string[] | null
   */
  onUrlChange: (url: string | string[] | null) => void;
  /** Backend endpoint path, e.g. "/files/image", "/files/document" */
  endpoint: string;
  /** For `<input accept="...">`: e.g. "image/*" or ".pdf" */
  accept?: string;
  /** For preview rendering */
  fileType: FileType;
  helperText?: string;
  className?: string;
  /** Allow selecting & uploading multiple files */
  multiple?: boolean;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  label,
  name,
  value,
  onUrlChange,
  endpoint,
  accept,
  fileType,
  helperText,
  className,
  multiple = false,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setError(null);
    setIsUploading(true);

    try {
      const formData = new FormData();

      if (multiple) {
        Array.from(files).forEach((file) => {
          // backend should use @UploadedFiles('files') etc.
          formData.append("files", file);
        });
      } else {
        formData.append("file", files[0]);
      }

      const res = await apiRequest.post<{ fullPath: string | string[] }>(
        endpoint,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      const data = res.data;
      const fullPath = data?.fullPath;

      if (!fullPath) {
        throw new Error("Invalid upload response: missing fullPath");
      }

      // Normalize to array
      const urls = Array.isArray(fullPath) ? fullPath : [fullPath];

      const finalValue: string | string[] | null = multiple
        ? urls
        : urls[0] ?? null;

      onUrlChange(finalValue);
    } catch (err: any) {
      console.error("Upload error:", err?.response ?? err);
      setError(
        err?.response?.data?.message || err?.message || "Failed to upload file"
      );
      onUrlChange(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClear = () => {
    onUrlChange(null);
    setError(null);
  };

  const renderPreview = () => {
    if (!value) return null;

    const urls = Array.isArray(value) ? value : [value];

    switch (fileType) {
      case "image":
        return (
          <div className="mt-3 flex flex-wrap gap-3">
            {urls.map((u) => (
              <img
                key={u}
                src={u}
                alt="Preview"
                className="h-24 w-24 rounded-md object-cover border"
              />
            ))}
          </div>
        );

      case "video":
        return (
          <div className="mt-3 space-y-3">
            {urls.map((u) => (
              <video
                key={u}
                src={u}
                controls
                className="w-full max-w-md rounded-md border"
              />
            ))}
          </div>
        );

      case "audio":
        return (
          <div className="mt-3 space-y-2">
            {urls.map((u) => (
              <audio key={u} src={u} controls className="w-full max-w-md" />
            ))}
          </div>
        );

      case "document":
        return (
          <div className="mt-3 space-y-2">
            {urls.map((u) => (
              <div key={u} className="space-y-1">
                <a
                  href={u}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-blue-600 hover:underline"
                >
                  View document
                </a>
              </div>
            ))}
            <div className="border rounded-md p-3 text-xs text-gray-600 bg-gray-50">
              {multiple
                ? "PDFs uploaded. Click the links above to open."
                : "PDF uploaded. Click the link above to open."}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const hasValue = Array.isArray(value)
    ? value.length > 0
    : value && value.length > 0;

  return (
    <div className={`flex flex-col gap-2 ${className ?? ""}`}>
      {label && (
        <label htmlFor={name} className="text-sm font-medium text-gray-800">
          {label}
        </label>
      )}

      <div className="flex items-center gap-3">
        <label className="inline-flex items-center gap-2 rounded-md border border-dashed border-gray-300 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-100 cursor-pointer">
          <span>
            {isUploading
              ? "Uploading..."
              : hasValue
              ? multiple
                ? "Change files"
                : "Change file"
              : multiple
              ? "Upload files"
              : "Upload file"}
          </span>
          <input
            id={name}
            name={name}
            type="file"
            accept={accept}
            multiple={multiple}
            onChange={handleFileChange}
            className="hidden"
            disabled={isUploading}
          />
        </label>

        {hasValue && (
          <button
            type="button"
            onClick={handleClear}
            className="text-xs text-red-600 hover:underline"
          >
            Remove {multiple ? "all" : "file"}
          </button>
        )}
      </div>

      {helperText && <p className="text-xs text-gray-500">{helperText}</p>}

      {error && <p className="text-xs text-red-600">{error}</p>}

      {renderPreview()}

      {/* Hidden field so form submit still carries the URL(s) if needed */}
      {!multiple ? (
        <input type="hidden" name={name} value={(value as string) ?? ""} />
      ) : (
        <input
          type="hidden"
          name={name}
          value={Array.isArray(value) ? value.join(",") : ""}
        />
      )}
    </div>
  );
};
