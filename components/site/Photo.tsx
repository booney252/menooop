import Image from "next/image";

/* Every photograph on the page goes through here, so the ratio, the
   crop and the lilac ground under a still-loading image are the same
   everywhere. Ratio is width/height as it comes off the camera. */
export function Photo({
  src,
  alt,
  ratio,
  priority = false,
  sizes = "100vw",
  className = "",
}: {
  src: string;
  alt: string;
  ratio: number;
  priority?: boolean;
  sizes?: string;
  className?: string;
}) {
  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{
        aspectRatio: String(ratio),
        background: "color-mix(in srgb, var(--lilac) 45%, var(--cream))",
      }}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className="object-cover"
      />
    </div>
  );
}
