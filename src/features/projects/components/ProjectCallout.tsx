type ProjectCalloutProps = {
  value: string
  label: string
}


export default function ProjectCallout({
  value,
  label,
}: ProjectCalloutProps) {
  return (
    <aside
      className="
        my-4
        rounded-[8px_18px_10px_22px]
        border
        border-white/12
        bg-white/[0.018]
        px-4
        py-4
        md:px-5
      "
    >
      <div className="font-comic-serif text-3xl leading-tight text-white">
        {value}
      </div>

      <div className="mt-1.5 max-w-2xl font-comic text-base leading-7 text-white/75">
        {label}
      </div>
    </aside>
  )
}
