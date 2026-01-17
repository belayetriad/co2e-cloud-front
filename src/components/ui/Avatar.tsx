// src/components/ui/Avatar.tsx
type AvatarProps = { name: string; imageUrl?: string; className?: string };

export function Avatar({ name, imageUrl, className }: AvatarProps) {
  const fallback =
    name
      ?.split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "U";
  return imageUrl ? (
    // Put your <img> or Next <Image> here if preferred
    <img
      src={imageUrl}
      alt={name}
      className={className || "h-10 w-10 rounded-full object-cover"}
    />
  ) : (
    <div
      className={
        className ||
        "h-10 w-10 rounded-full bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center text-sm font-semibold"
      }
    >
      {fallback}
    </div>
  );
}
