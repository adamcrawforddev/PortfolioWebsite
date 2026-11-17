import type {
  ReactNode,
} from "react"


type ProjectSectionProps = {
  title: string
  eyebrow?: string
  children: ReactNode
}


export default function ProjectSection({
  title,
  eyebrow,
  children,
}: ProjectSectionProps) {
  return (
    <section className="py-4">
      {eyebrow && (
        <div className="mb-2 font-comic text-sm uppercase tracking-[0.12em] text-white/65">
          {eyebrow}
        </div>
      )}

      <h2 className="font-comic-serif text-[26px] leading-tight text-white md:text-[30px]">
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
    </section>
  )
}
