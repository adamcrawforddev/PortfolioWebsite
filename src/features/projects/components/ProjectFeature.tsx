import type {
  ReactNode,
} from "react"

import ProjectVideo from "./ProjectVideo"


type ProjectFeatureProps = {
  title: string
  children: ReactNode

  image?: string
  imageAlt?: string

  video?: string
  videoAlt?: string
  videoCaption?: string

  mediaSide?: "left" | "right"
}


export default function ProjectFeature({
  title,
  children,

  image,
  imageAlt = "",

  video,
  videoAlt = "",
  videoCaption,

  mediaSide = "right",
}: ProjectFeatureProps) {
  const imageBlock =
    image && (
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
          src={image}
          alt={imageAlt}
          className="
            block
            h-auto
            w-full
            rounded-[6px_15px_8px_18px]
            object-cover
          "
        />
      </div>
    )

  const videoBlock =
    video && (
      <ProjectVideo
        src={video}
        alt={videoAlt}
        caption={videoCaption}
        contain
        flush
      />
    )

  const mediaBlock =
    videoBlock ??
    imageBlock


  const media = mediaBlock && (
    <div className="flex min-w-0 items-center">
      <div className="w-full">
        {mediaBlock}
      </div>
    </div>
  )


  const content = (
    <div className="flex min-w-0 items-center">
      <div className="w-full">
        <h2
          className="
            font-comic-serif
            text-[26px]
            leading-tight
            text-white
            md:text-[30px]
          "
        >
          {title}
        </h2>

        <div
          className="
            mt-3
            max-w-3xl
            font-comic
            text-lg
            leading-8
            text-white/80
          "
        >
          {children}
        </div>
      </div>
    </div>
  )


  return (
    <section
      className={`
        my-7
        grid
        gap-6

        ${
          mediaBlock
            ? `
              md:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]
              md:gap-8
            `
            : "grid-cols-1"
        }
      `}
    >
      {mediaSide === "left" && media}

      {content}

      {mediaSide === "right" && media}
    </section>
  )
}