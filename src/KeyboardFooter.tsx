type KeyboardFooterProps = {
  projectOpen: boolean
  canGoBack: boolean
  actionLabel: string
}

function KeyHint({ keys, action }: { keys: string[]; action: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex items-center gap-2">
        {keys.map((key) => (
          <kbd
            key={key}
            className={`inline-flex items-center justify-center border border-white/20 ${key === "↑" || key === "↓" ? "px-1.5" : "px-2"} py-0.5 font-comic text-sm font-normal text-white/80`}
          >
            <span className={key === "↑" || key === "↓" ? "" : "relative top-[2px]"}>
              {key.toUpperCase()}
            </span>
          </kbd>
        ))}
      </span>
      <span className="relative top-[2px] font-comic text-sm font-normal uppercase text-white/75">
        {action}
      </span>
    </div>
  )
}

export default function KeyboardFooter({ projectOpen, canGoBack, actionLabel }: KeyboardFooterProps) {
  return (
    <footer
      aria-label="Keyboard navigation"
      className="mt-6 flex shrink-0 flex-wrap items-center gap-x-4 gap-y-3 border-t border-dashed border-white/20 pt-4 font-comic text-sm text-white/75"
    >
      {projectOpen ? (
        <KeyHint keys={["ESC"]} action="BACK TO PROJECTS" />
      ) : (
        <>
          <KeyHint keys={["↑", "↓"]} action="MOVE" />
          <KeyHint keys={["ENTER"]} action={actionLabel} />
          {canGoBack && <KeyHint keys={["ESC"]} action="BACK" />}
        </>
      )}
    </footer>
  )
}
