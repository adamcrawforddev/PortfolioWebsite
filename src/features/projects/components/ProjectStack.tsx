import type {
  StackGroup,
} from "../types"


type ProjectStackProps = {
  groups: StackGroup[]
}


export default function ProjectStack({
  groups,
}: ProjectStackProps) {
  return (
    <section className="pb-4 pt-5">
      <h2 className="mb-4 font-comic-serif text-[26px] leading-tight text-white md:text-[30px]">
        Built with
      </h2>

      <div className="grid gap-3 md:grid-cols-2">
        {groups.map(
          (group) => (
            <div
              key={group.label}
              className="
                rounded-[7px_15px_9px_18px]
                border
                border-white/12
                bg-white/[0.015]
                px-4
                py-4
              "
            >
              <div className="font-comic text-sm uppercase tracking-[0.12em] text-white/65">
                {group.label}
              </div>

              <div className="mt-1 font-comic text-base leading-7 text-white/85">
                {group.items.join(
                  " · "
                )}
              </div>
            </div>
          )
        )}
      </div>
    </section>
  )
}
