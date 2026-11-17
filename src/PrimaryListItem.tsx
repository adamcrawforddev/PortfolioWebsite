type ListItemProps = {
  name: string
  underline: string
  selected: boolean
  directory?: boolean
  onClick: () => void
}

function PrimaryListItem({
  name,
  underline,
  selected,
  directory = false,
  onClick,
}: ListItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={selected ? "true" : undefined}
      className={`
        group flex w-max items-center gap-3 whitespace-nowrap rounded-sm
        py-2 text-left font-comic text-[30px] md:text-[32px] font-medium leading-snug
        transition-[color,transform] duration-150
        focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/80
        ${selected
          ? "translate-x-2 text-white"
          : "text-[#B4C0D4] hover:translate-x-1 hover:text-white"}
      `}
    >
      <span
        aria-hidden="true"
        className={`w-4 shrink-0 text-center font-bold transition-opacity duration-150 ${selected ? "opacity-100" : "opacity-0"}`}
      >
        &gt;
      </span>
      <span className="relative inline-block whitespace-nowrap">
        {name}
        {directory && (
          <span aria-hidden="true" className={selected ? "ml-1 text-white/75" : "ml-1 text-[#9AAAC4]"}>
            /
          </span>
        )}
        {selected && (
          <img
            src={underline}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-2 left-0 h-[14px] w-full max-w-none"
          />
        )}
      </span>
    </button>
  )
}

export default PrimaryListItem
