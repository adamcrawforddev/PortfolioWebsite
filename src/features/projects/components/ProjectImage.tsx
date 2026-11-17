type ProjectImageProps = {
  src: string
  alt: string
  caption?: string
  contain?: boolean
}


export default function ProjectImage({
  src,
  alt,
  caption,
  contain = false,
}: ProjectImageProps) {
  return (
    <figure className="my-5">
      <div
        className="
          overflow-hidden
          rounded-[8px_18px_10px_22px]
          border
          border-white/12
          bg-white/[0.02]
          p-1
        "
      >
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          className={`
            block
            w-full
            rounded-[6px_15px_8px_18px]
            ${
              contain
                ? "object-contain"
                : "object-cover"
            }
          `}
        />
      </div>

      {caption && (
        <figcaption className="mt-2 px-2 font-comic text-sm leading-6 text-white/65">
          {caption}
        </figcaption>
      )}
    </figure>
  )
}
