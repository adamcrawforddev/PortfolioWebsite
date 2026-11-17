import type { CSSProperties } from "react"
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"
import List from "./List"
import BugSquasher from "./features/bug-squasher/BugSquasher"
import PacketPolice from "./features/packet-police/PacketPolice"
import MemoryLeak from "./features/memory-leak/MemoryLeak"
import type { MiniGameId } from "./types/minigames"

type ActiveApp = "portfolio" | MiniGameId
type AppPhase = "visible" | "ready-forward" | "ready-back"
type TransitionStage = "idle" | "measure" | "animate"

const FRAME_DURATION = 800
const ENTER_DELAY = 260
const ENTER_DURATION = 540
const GAME_INFO: Record<MiniGameId, { footer: string }> = {
  "ci-cd-defense": { footer: "don't ship bugs :)" },
  "packet-police": { footer: "inspect before you accept :)" },
  "memory-leak": { footer: "where did that memory go?" },
}

function formatPortfolioTime(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const parts: string[] = []
  if (hours > 0) parts.push(`${hours} ${hours === 1 ? "hour" : "hours"}`)
  if (minutes > 0 || hours > 0) parts.push(`${minutes} ${minutes === 1 ? "minute" : "minutes"}`)
  parts.push(`${seconds} ${seconds === 1 ? "second" : "seconds"}`)
  return parts.join(" ")
}

function Container() {
  const [activeApp, setActiveApp] = useState<ActiveApp>("portfolio")
  const [outgoingApp, setOutgoingApp] = useState<ActiveApp | null>(null)
  const [lastMiniGame, setLastMiniGame] = useState<MiniGameId | null>(null)
  const [appPhase, setAppPhase] = useState<AppPhase>("visible")
  const [stage, setStage] = useState<TransitionStage>("idle")
  const [showHireMe, setShowHireMe] = useState(false)
  const [hireMeTime, setHireMeTime] = useState(0)
  const portfolioStartTime = useRef(Date.now())

  const sectionRef = useRef<HTMLElement>(null)
  const fieldsetRef = useRef<HTMLFieldSetElement>(null)
  const incomingRef = useRef<HTMLDivElement>(null)
  const gameContentRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<HTMLDivElement>(null)
  const outgoingSnapshotRef = useRef<HTMLElement | null>(null)
  const snapshotHostRef = useCallback((host: HTMLDivElement | null) => {
    if (host && outgoingSnapshotRef.current) {
      host.replaceChildren(outgoingSnapshotRef.current)
    }
  }, [])
  const lockedRef = useRef(false)
  const timersRef = useRef<number[]>([])
  const rafRef = useRef<number | null>(null)
  const [contentHeight, setContentHeight] = useState<number | null>(null)
  const [frameWidth, setFrameWidth] = useState<number | null>(null)
  const [incomingWidth, setIncomingWidth] = useState<number | null>(null)
  const [outgoingWidth, setOutgoingWidth] = useState<number | null>(null)
  const [outgoingHeight, setOutgoingHeight] = useState<number | null>(null)
  const [targetWidth, setTargetWidth] = useState<number | null>(null)
  const [targetHeight, setTargetHeight] = useState<number | null>(null)
  const [displayFooter, setDisplayFooter] = useState("keyboard recommended :)")
  const [pendingFooter, setPendingFooter] = useState<string | null>(null)
  const [projectOpen, setProjectOpen] = useState(false)
  const [viewportHeight, setViewportHeight] = useState(() => window.innerHeight)
  const nextFooterRef = useRef<string | null>(null)
  const portfolioMeasuredHeightRef = useRef<number | null>(null)

  useEffect(() => {
    const update = () => setViewportHeight(window.innerHeight)
    window.addEventListener("resize", update)
    return () => window.removeEventListener("resize", update)
  }, [])

  const gameOpen = activeApp !== "portfolio"
  const [frameTop, setFrameTop] = useState(160)
  useLayoutEffect(() => {
    const update = () => {
      const top = frameRef.current?.getBoundingClientRect().top
      if (top !== undefined) setFrameTop(top)
    }
    update()
    window.addEventListener("resize", update)
    return () => window.removeEventListener("resize", update)
  }, [activeApp, stage])
  // Leave room for game headings, controls, fieldset padding and the bottom border.
  // Reserve space below the board for each game's HUD/controls, the fieldset
  // bottom padding and the small grey caption OUTSIDE the border.
  // This is a conservative shared budget; the game canvases retain their ratio.
  const gameViewportHeight = Math.max(240, viewportHeight - frameTop - 72)
  // All three games receive the exact same frame dimensions. Their boards
  // scale independently within that common space to preserve aspect ratios.
  // Shared board budget: keep the same board-height allowance for all three games.
  // The frame itself already reserves the external footer and border spacing.
  // 200px leaves room for each game’s heading, status bar and controls, while
  // giving the boards 60px more height than the previous 260px allowance.
  const boardHeightBudget = Math.max(120, gameViewportHeight - 200)
  const expanded = gameOpen || showHireMe

  const handlePortfolioHeight = useCallback((height: number) => {
    const frameTop = frameRef.current?.getBoundingClientRect().top ?? 0
    const availableHeight = Math.max(0, viewportHeight - frameTop - 64)
    const next = projectOpen ? Math.max(height, availableHeight) : height
    // The directory is measured while the game frame is still at its old
    // height. Keep that intrinsic measurement for the reverse morph; the
    // wrapper's getBoundingClientRect() would otherwise report the game height.
    portfolioMeasuredHeightRef.current = next
    if (stage !== "idle") return
    setContentHeight(previous => previous !== null && Math.abs(previous - next) < 0.5 ? previous : next)
  }, [stage, projectOpen, viewportHeight])

  useLayoutEffect(() => {
    if (!gameOpen || showHireMe || stage !== "idle") return
    const element = gameContentRef.current
    if (!element) return
    const update = () => {
      const height = gameViewportHeight
      setContentHeight(previous => previous !== null && Math.abs(previous - height) < 0.5 ? previous : height)
    }
    const observer = new ResizeObserver(update)
    observer.observe(element)
    update()
    return () => observer.disconnect()
  }, [gameOpen, showHireMe, stage, gameViewportHeight])

  const clearTimers = () => {
    timersRef.current.forEach(window.clearTimeout)
    timersRef.current = []
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    rafRef.current = null
  }

  const schedule = (callback: () => void, delay: number) => {
    timersRef.current.push(window.setTimeout(callback, delay))
  }

  const beginAppTransition = (destination: ActiveApp) => {
    if (lockedRef.current || stage !== "idle" || destination === activeApp || showHireMe) return
    const section = sectionRef.current
    const fieldset = fieldsetRef.current
    const frame = frameRef.current
    if (!section || !fieldset || !frame) return

    lockedRef.current = true
    clearTimers()

    // Snapshot the live terminal BEFORE React replaces it. This retains the
    // already-measured grid columns, separator and preview positions.
    // A second <List /> would remount with its default 260px column width.
    outgoingSnapshotRef.current = destination !== "portfolio"
      ? (incomingRef.current?.firstElementChild?.cloneNode(true) as HTMLElement | null)
      : null

    const currentWidth = section.getBoundingClientRect().width
    const availableWidth = window.innerWidth - (window.innerWidth >= 768 ? 64 : 32)
    const destinationWidth = Math.min(availableWidth, destination === "portfolio" ? 1024 : 1152)
    const fieldsetStyle = getComputedStyle(fieldset)
    const horizontalInset = parseFloat(fieldsetStyle.paddingLeft) + parseFloat(fieldsetStyle.paddingRight) +
      parseFloat(fieldsetStyle.borderLeftWidth) + parseFloat(fieldsetStyle.borderRightWidth)

    // The destination is laid out at its FINAL width before any animation begins.
    // This avoids responsive canvases changing the height target mid-transition.
    setFrameWidth(currentWidth)
    setTargetWidth(destinationWidth)
    const currentInnerWidth = Math.max(1, currentWidth - horizontalInset)
    const destinationInnerWidth = Math.max(1, destinationWidth - horizontalInset)
    // Lock BOTH views to their own natural layout widths. The text must never
    // reflow as the outer frame animates: the whole view scales as one layer.
    setOutgoingWidth(currentInnerWidth)
    setOutgoingHeight(frame.getBoundingClientRect().height)
    setIncomingWidth(destinationInnerWidth)
    setContentHeight(frame.getBoundingClientRect().height)
    if (destination === "portfolio") portfolioMeasuredHeightRef.current = null
    setOutgoingApp(activeApp)
    nextFooterRef.current = destination === "portfolio" ? "keyboard recommended :)" : GAME_INFO[destination].footer
    setPendingFooter(nextFooterRef.current)
    setActiveApp(destination)
    setAppPhase(destination === "portfolio" ? "ready-back" : "ready-forward")
    setStage("measure")
    if (destination !== "portfolio") setLastMiniGame(destination)
  }

  // useLayoutEffect runs after the incoming screen has mounted, but before paint.
  // Read the destination at its fixed final width, then start BOTH dimensions together.
  useLayoutEffect(() => {
    if (stage !== "measure" || !incomingRef.current || targetWidth === null) return
    const incoming = incomingRef.current
    const height = incoming.getBoundingClientRect().height
    // On the way back, use the directory's *intrinsic* measured content
    // height, not its flex-stretched wrapper inside the outgoing game frame.
    const portfolioHeight = portfolioMeasuredHeightRef.current
    setTargetHeight(activeApp === "portfolio" ? (portfolioHeight ?? height) : gameViewportHeight)
    // The initial frame is still at its old size. The next paint starts a single
    // linear interpolation to the locked width and height.
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = requestAnimationFrame(() => setStage("animate"))
    })
  }, [stage, activeApp, targetWidth, gameViewportHeight])

  useEffect(() => {
    if (stage !== "animate") return
    schedule(() => {
      setAppPhase("visible")
      // The footer captions crossfade in separate, right-anchored layers.
      // Never replace the text mid-animation: different string lengths
      // otherwise look like the right-hand text jumps horizontally.
    }, ENTER_DELAY)
    schedule(() => {
      if (nextFooterRef.current !== null) {
        setDisplayFooter(nextFooterRef.current)
        nextFooterRef.current = null
      }
      setPendingFooter(null)
      setStage("idle")
      setContentHeight(targetHeight)
      setOutgoingApp(null)
      outgoingSnapshotRef.current = null
      setFrameWidth(null)
      setIncomingWidth(null)
      setOutgoingWidth(null)
      setOutgoingHeight(null)
      setTargetWidth(null)
      setTargetHeight(null)
      lockedRef.current = false
    }, Math.max(FRAME_DURATION, ENTER_DELAY + ENTER_DURATION) + 60)
    return () => {
      // Timers are also cleared when starting another transition or unmounting.
    }
  }, [stage])

  useEffect(() => () => clearTimers(), [])

  const closeActiveApp = () => {
    if (activeApp !== "portfolio") beginAppTransition("portfolio")
  }
  const openHireMe = () => {
    if (lockedRef.current) return
    setHireMeTime(Math.max(1, Math.floor((Date.now() - portfolioStartTime.current) / 1000)))
    setShowHireMe(true)
  }

  useEffect(() => {
    if (!showHireMe) return
    const update = () => setHireMeTime(Math.max(1, Math.floor((Date.now() - portfolioStartTime.current) / 1000)))
    update()
    const interval = window.setInterval(update, 1000)
    return () => window.clearInterval(interval)
  }, [showHireMe])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return
      if (showHireMe) {
        event.preventDefault()
        setShowHireMe(false)
      } else if (gameOpen && !lockedRef.current) {
        event.preventDefault()
        closeActiveApp()
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  })

  const renderGame = (app: ActiveApp) => {
    switch (app) {
      case "ci-cd-defense": return <BugSquasher />
      case "packet-police": return <PacketPolice />
      case "memory-leak": return <MemoryLeak />
      default: return null
    }
  }

  return (
    <>
      <style>{`
        /* Keep text layout stable. Only a subtle entrance scale is applied,
           avoiding mismatched width-driven scaling against the moving frame. */
        .portfolio-app-motion.app-view-transition {
          transform-origin: center top;
          backface-visibility: hidden;
          will-change: opacity, transform;
        }
        .portfolio-app-motion.app-view-outgoing {
          opacity: 1;
          transform: scale(1) translateZ(0);
          transition: opacity 230ms cubic-bezier(.4,0,1,1),
                      transform 800ms cubic-bezier(0.45,0,0.2,1);
        }
        .portfolio-app-motion.app-view-outgoing.app-view-departing {
          opacity: 0;
          transform: scale(var(--outgoing-scale, 1)) translateZ(0);
        }
        .portfolio-app-motion.app-view-ready-forward,
        .portfolio-app-motion.app-view-ready-back {
          opacity: 0;
          transform: scale(.985) translateZ(0);
          transition: none;
          pointer-events: none;
        }
        .portfolio-app-motion.app-view-visible {
          opacity: 1;
          transform: scale(1) translateZ(0);
          transition: opacity 540ms cubic-bezier(.22,1,.36,1),
                      transform 540ms cubic-bezier(.22,1,.36,1);
        }
        /* Minigame handoff: the outer morph owns the animation.
           Prevent the freshly mounted outgoing terminal's internal slide,
           grid and panel animations from moving its preview. */
        .mini-game-handoff *,
        .mini-game-handoff *::before,
        .mini-game-handoff *::after {
          transition-property: none !important;
          animation: none !important;
        }
        @media (prefers-reduced-motion: reduce) {
          .portfolio-app-motion.app-view-transition { transition: none !important; transform: none !important; }
          .portfolio-app-motion.app-view-outgoing.app-view-departing { opacity: 0; }
          .portfolio-app-motion.app-view-ready-forward,
          .portfolio-app-motion.app-view-ready-back { opacity: 0; }
        }
      `}</style>
    <main className="min-h-screen bg-navy-dark px-4 pb-8 pt-6 md:px-8 md:pb-10 md:pt-8">
      <section
        ref={sectionRef}
        className={`mx-auto transition-[max-width] duration-[440ms] ease-linear motion-reduce:transition-none ${frameWidth === null ? (expanded ? "max-w-6xl" : "max-w-5xl") : "max-w-none"}`}
        style={{
          width: frameWidth === null ? undefined : `${stage === "animate" ? targetWidth : frameWidth}px`,
          maxWidth: frameWidth === null ? undefined : "100%",
          transition: stage === "animate" ? `width ${FRAME_DURATION}ms cubic-bezier(0.45, 0, 0.2, 1)` : "none",
        }}
      >
        <div className="relative">
        <fieldset ref={fieldsetRef} className="w-full rounded-[8px_18px_10px_22px] border-2 border-white/75 px-5 pb-5 shadow-[8px_8px_0_rgba(255,255,255,0.06)] md:px-8 md:pb-7">
          <legend className="ml-2 px-2 md:ml-4">
            <div className="relative px-2">
              <span className="absolute -left-2 top-1/2 h-3 w-3 -translate-y-1/2 rotate-[-45deg] rounded-full border-2 border-white/75 border-b-transparent border-r-transparent" />
              <h1 className="font-comic-serif text-3xl leading-none text-white md:text-5xl">Adam Crawford</h1>
              <span className="absolute -right-2 top-1/2 h-3 w-3 -translate-y-1/2 rotate-[45deg] rounded-full border-2 border-white/75 border-b-transparent border-l-transparent" />
            </div>
          </legend>

          <div className="relative flex flex-col overflow-hidden pt-5 md:pt-6">
            {!showHireMe && (
              <div className="absolute right-0 top-0 z-10 flex items-center gap-2 font-comic text-xs text-white/55">
                <button type="button" onClick={openHireMe} aria-label="Minimise" className="transition-colors hover:text-white/70">[ _ ]</button>
                <button type="button" onClick={openHireMe} aria-label="Maximise" className="transition-colors hover:text-white/70">[ □ ]</button>
                <button type="button" onClick={openHireMe} aria-label="Close" className="transition-colors hover:text-red-400">[ × ]</button>
              </div>
            )}
            {showHireMe ? (
              <div className="flex min-h-[450px] w-full items-center justify-center px-3 py-12 sm:px-6 md:px-10 lg:px-14">
                <div className="flex w-full max-w-3xl flex-col items-center justify-center text-center">
                  <p className="w-full max-w-2xl px-2 font-comic text-sm leading-6 text-white/75 sm:px-4 md:text-base">you've spent <span className="text-white/70">{formatPortfolioTime(hireMeTime)}</span> on my portfolio, you may as well</p>
                  <div className="my-6 font-comic-serif text-6xl leading-none text-red-500 sm:text-7xl md:text-8xl">HIRE ME</div>
                  <button type="button" onClick={() => setShowHireMe(false)} className="group mt-3 flex items-center gap-3 font-comic text-xs text-white/65 transition-colors hover:text-white/75">
                    <span className="transition-transform duration-150 group-hover:-translate-x-1">&lt;</span><span>go back</span>
                    <span className="ml-1 border border-white/15 px-1.5 py-0.5 text-[9px] text-white/55">ESC</span>
                  </button>
                </div>
              </div>
            ) : (
              <div
                ref={frameRef}
                className="relative overflow-hidden motion-reduce:transition-none"
                data-game-frame={gameOpen ? "true" : undefined}
                style={{
                  "--game-board-max-height": `${boardHeightBudget}px`,
                  "--game-viewport-height": `${gameViewportHeight}px`,
                  height: contentHeight === null ? undefined : `${stage === "animate" ? targetHeight ?? contentHeight : contentHeight}px`,
                  transition: stage === "animate" ? `height ${FRAME_DURATION}ms cubic-bezier(0.45, 0, 0.2, 1)` : stage === "idle" ? `height ${FRAME_DURATION}ms cubic-bezier(0.22,1,0.36,1)` : "none",
                } as CSSProperties}
              >
                {outgoingApp !== null && (
                  <div aria-hidden="true" className={`portfolio-app-motion app-view-transition app-view-outgoing pointer-events-none absolute top-0 z-10 ${outgoingApp === "portfolio" ? "mini-game-handoff" : ""} ${stage === "animate" ? "app-view-departing" : ""}`} style={{
                     // The frozen DOM keeps its original layout width; scale it as a
                     // single visual layer, centred with the expanding frame.
                     // No text or separator is remeasured during the fade.
                     left: 0,
                     "--outgoing-scale": outgoingApp === "portfolio" && outgoingWidth && incomingWidth
                       ? incomingWidth / outgoingWidth
                       : 1,
                     width: outgoingWidth === null ? "100%" : `${outgoingWidth}px`,
                     height: outgoingHeight === null ? "100%" : `${outgoingHeight}px`,
                   } as CSSProperties}>
                    {outgoingApp === "portfolio" ? (
                      <div ref={snapshotHostRef} className="h-full w-full" />
                    ) : (
                      <div className="min-w-0">{renderGame(outgoingApp)}</div>
                    )}
                  </div>
                )}
                <div
                  ref={incomingRef}
                  className={`portfolio-app-motion app-view-transition ${stage === "idle" ? "relative" : "absolute left-0 top-0"} ${appPhase === "ready-forward" ? "app-view-ready-forward" : appPhase === "ready-back" ? "app-view-ready-back" : "app-view-visible"}`}
                  style={{
                    width: stage === "idle" ? "100%" : `${incomingWidth ?? 0}px`,
                    // During measurement the destination must retain its natural height.
                    // Otherwise fill the animated frame so the keyboard footer stays
                    // anchored to its bottom edge on every animation frame.
                    height: stage === "measure" ? undefined : "100%",
                  }}
                >
                  {activeApp === "portfolio" ? (
                    <List onLaunchMiniGame={beginAppTransition} returnToMiniGame={lastMiniGame} onContentHeightChange={handlePortfolioHeight} onProjectOpenChange={setProjectOpen} />
                  ) : (
                    <div ref={gameContentRef} className="min-w-0 h-full" style={{ minHeight: "var(--game-viewport-height)" }}>{renderGame(activeApp)}</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </fieldset>
        {/* Anchor to the bottom of the fieldset-sized wrapper, not to a
            padding-adjusted bottom edge. The footer has no position animation. */}
        <div className="pointer-events-none absolute right-0 top-full mt-2 min-h-[1.25rem] rotate-[-1deg] text-right font-comic text-xs text-white/55">
          {showHireMe ? (
            <p>worth a shot :)</p>
          ) : pendingFooter !== null ? (
            <div className="relative">
              <p className={`whitespace-nowrap transition-opacity duration-[180ms] ${stage === "animate" ? "opacity-0" : "opacity-100"}`}>{displayFooter}</p>
              <p className={`absolute right-0 top-0 whitespace-nowrap transition-opacity duration-[360ms] ${appPhase === "visible" && stage === "animate" ? "opacity-100" : "opacity-0"}`}>{pendingFooter}</p>
            </div>
          ) : (
            <p className="whitespace-nowrap">{displayFooter}</p>
          )}
        </div>
        </div>
      </section>
    </main>
    </>
  )
}

export default Container
