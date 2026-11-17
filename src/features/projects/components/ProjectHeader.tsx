import type {
  ProjectLink,
} from "../types"


type ProjectHeaderProps = {
  title: string
  subtitle: string
  stack: string[]
  links?: ProjectLink[]
}


export default function ProjectHeader({
  title,
  subtitle,
  stack,
  links = [],
}: ProjectHeaderProps) {
  return (
    <header className="pb-5">
      <div
        className="
          flex
          items-start
          justify-between
          gap-5
        "
      >
        <h1
          className="
            min-w-0
            max-w-3xl
            font-comic-serif
            text-3xl
            leading-[1.05]
            text-white
            md:text-4xl
          "
        >
          {title}
        </h1>


        {links.length > 0 && (
          <div
            className="
              flex
              shrink-0
              flex-wrap
              justify-end
              gap-2
            "
          >
            {links.map(
              (link) => {
                const isAvailable =
                  link.href.trim().length > 0

                if (!isAvailable) {
                  return (
                    <div
                      key={link.label}
                      className="
                        group
                        relative
                      "
                    >
                      <div
                        tabIndex={0}
                        className="
                          cursor-help
                          rounded-[6px_12px_7px_14px]
                          border
                          border-white/14
                          bg-white/[0.01]
                          px-4
                          py-2
                          font-comic
                          text-base
                          leading-6
                          text-white/65
                          transition-[border-color,color,background-color]
                          duration-200
                          md:text-base

                          group-hover:border-white/25
                          group-hover:bg-white/[0.025]
                          group-hover:text-white/60

                          focus-visible:outline
                          focus-visible:outline-1
                          focus-visible:outline-offset-2
                          focus-visible:outline-white/50
                        "
                      >
                        {link.label}
                      </div>


                      <div
                        role="tooltip"
                        className="
                          pointer-events-none
                          absolute
                          right-0
                          top-full
                          z-30
                          mt-2
                          w-max
                          max-w-[260px]

                          translate-y-1
                          rounded-[6px_12px_7px_14px]
                          border
                          border-white/12
                          bg-[#000112]/95
                          px-3
                          py-2

                          font-comic
                          text-sm
                          leading-6
                          text-white/80

                          opacity-0
                          shadow-[0_8px_24px_rgba(0,0,0,0.35)]
                          backdrop-blur-md

                          transition-[opacity,transform]
                          duration-200

                          group-hover:translate-y-0
                          group-hover:opacity-100

                          group-focus-within:translate-y-0
                          group-focus-within:opacity-100
                        "
                      >
                        {link.unavailableMessage ??
                          "This repository is not publicly available."}
                      </div>
                    </div>
                  )
                }


                return (
                  <a
                    key={link.href}
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                    className="
                      inline-flex
                      min-h-11
                      items-center
                      justify-center
                      gap-2
                      rounded-[6px_12px_7px_14px]
                      border
                      border-white/22
                      bg-white/[0.02]
                      px-4
                      py-2
                      font-comic
                      text-base
                      leading-none
                      text-white/80
                      transition-[border-color,color,background-color]
                      duration-200
                      hover:border-white/40
                      hover:bg-white/[0.05]
                      hover:text-white
                      focus-visible:outline-2
                      focus-visible:outline-offset-2
                      focus-visible:outline-white/80
                    "
                  >
                    <span className="relative top-[2px]">
  {link.label}
</span>

<span aria-hidden="true" className="text-lg leading-none relative top-[2px]">
  🔗
</span>
                  </a>
                )
              }
            )}
          </div>
        )}
      </div>


      <div
        className="
          mt-3
          flex
          flex-wrap
          items-center
          gap-x-3.5
          gap-y-1.5
        "
      >
        {stack.map(
          (
            technology,
            index
          ) => (
            <div
              key={technology}
              className="flex items-center"
            >
              <span
                className="
                  font-comic
                  text-lg
                  leading-6
                  text-white/85
                  lg:text-2xl
                "
              >
                {technology}
              </span>

              {index < stack.length - 1 && (
                <span
                  aria-hidden="true"
                  className="
                    ml-3.5
                    font-comic
                    text-base
                    text-white/18
                    lg:text-lg
                  "
                >
                  /
                </span>
              )}
            </div>
          )
        )}
      </div>


      <p
        className="
          mt-3
          max-w-2xl
          font-comic
          text-lg
          leading-8
          text-white/75
        "
      >
        {subtitle}
      </p>
    </header>
  )
}