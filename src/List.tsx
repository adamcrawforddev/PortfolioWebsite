import type { CSSProperties } from "react"
import KeyboardFooter from "./KeyboardFooter"
import {

  useEffect,
  useLayoutEffect,

  useRef,

  useState,

} from "react"

import PrimaryListItem from "./PrimaryListItem"

import SectionPanel from "./SectionPanel"

import PlanItProject from "./features/projects/projects/planit/PlanItProject"

import SelfDrivingCarProject from "./features/projects/projects/car-rl/SelfDrivingCarProject"

import RestaurantManagementProject from "./features/projects/projects/restaurant-management/RestaurantManagementProject"

import SpotifyRekordboxProject from "./features/projects/projects/spotify-rekordbox/SpotifyRekordboxProject"

import {

  navigation,

  underlines,

} from "./data/navigation"

import {

  isMiniGame,

} from "./types/minigames"

import type {

  NavigationItem,

} from "./types/navigation"

import type {

  MiniGameId,

} from "./types/minigames"

// ========================================

// CONFIG

// ========================================

const PANEL_OUT_DURATION = 220

const SEPARATOR_PADDING = 12

const DIRECTORY_OUT_DURATION = 180

const PROJECT_OUT_DURATION = 200

// ========================================

// TRANSITION TYPES

// ========================================

type PanelPhase =

  | "visible"

  | "out"

  | "ready"

type DirectoryPhase =

  | "visible"

  | "out-forward"

  | "ready-forward"

  | "out-back"

  | "ready-back"

type ProjectPhase =

  | "visible"

  | "out-forward"

  | "ready-forward"

  | "out-back"

  | "ready-back"

// ========================================

// PROPS

// ========================================

type ListProps = {

  onLaunchMiniGame:

    (game: MiniGameId) => void

  returnToMiniGame?:

    MiniGameId | null

  onContentHeightChange?: (height: number) => void
  onProjectOpenChange?: (open: boolean) => void
  disableGridMotion?: boolean

}

// ========================================

// FIND MINIGAMES DIRECTORY

// ========================================

function findMinigamesDirectory() {

  return (

    navigation.find(

      (item) =>

        item.id ===

        "minigames"

    ) ?? null

  )

}

// ========================================

// INITIAL NAVIGATION STATE

// ========================================

function getInitialNavigationStack(

  returnToMiniGame:

    MiniGameId | null | undefined

): NavigationItem[] {

  if (!returnToMiniGame) {

    return []

  }

  const minigamesDirectory =

    findMinigamesDirectory()

  if (!minigamesDirectory) {

    return []

  }

  return [

    minigamesDirectory,

  ]

}

function getInitialSelectedIndex(

  returnToMiniGame:

    MiniGameId | null | undefined

) {

  if (!returnToMiniGame) {

    return 0

  }

  const minigamesDirectory =

    findMinigamesDirectory()

  const children =

    minigamesDirectory

      ?.children ??

    []

  const index =

    children.findIndex(

      (item) =>

        item.id ===

        returnToMiniGame

    )

  return index >= 0

    ? index

    : 0

}

// ========================================

// PROJECTS

// ========================================

type ProjectId =

  | "planit"

  | "car-rl"

  | "restaurant"

  | "rekordbox"

function isProjectId(

  id: string

): id is ProjectId {

  return (

    id === "planit" ||

    id === "car-rl" ||

    id === "restaurant" ||

    id === "rekordbox"

  )

}

// ========================================

// COMPONENT

// ========================================

function List({

  onLaunchMiniGame,

  returnToMiniGame = null,
  onContentHeightChange,
  onProjectOpenChange,
  disableGridMotion = false,

}: ListProps) {

  const initialSelectedIndex =

    getInitialSelectedIndex(

      returnToMiniGame

    )

  // ========================================

  // NAVIGATION STATE

  // ========================================

  const [

    navigationStack,

    setNavigationStack,

  ] =

    useState<NavigationItem[]>(

      () =>

        getInitialNavigationStack(

          returnToMiniGame

        )

    )

  const [

    selectedIndex,

    setSelectedIndex,

  ] =

    useState(

      initialSelectedIndex

    )

  const [

    displayedIndex,

    setDisplayedIndex,

  ] =

    useState(

      initialSelectedIndex

    )

  // ========================================

  // PROJECT STATE

  // ========================================

  const [

    activeProject,

    setActiveProject,

  ] =

    useState<ProjectId | null>(

      null

    )

  const [

    projectPhase,

    setProjectPhase,

  ] =

    useState<ProjectPhase>(

      "visible"

    )

  // ========================================

  // PANEL STATE

  // ========================================

  const [

    panelPhase,

    setPanelPhase,

  ] =

    useState<PanelPhase>(

      "visible"

    )

  // ========================================

  // DIRECTORY STATE

  // ========================================

  const [

    directoryPhase,

    setDirectoryPhase,

  ] =

    useState<DirectoryPhase>(

      "visible"

    )

  // ========================================

  // ANIMATION REFS

  // ========================================

  // Synchronous guard: prevents overlapping keyboard/click transitions.
  const transitionLockedRef = useRef(false)

  const timeoutRef =

    useRef<number | null>(

      null

    )

  const directoryListRef = useRef<HTMLDivElement | null>(null)
  const previewRef = useRef<HTMLDivElement | null>(null)
  const directoryGridRef = useRef<HTMLDivElement | null>(null)
  const naturalViewRef = useRef<HTMLDivElement | null>(null)
  const footerRef = useRef<HTMLDivElement | null>(null)
  const [separatorHeight, setSeparatorHeight] = useState(0)
  const [listWidth, setListWidth] = useState(260)

  const frameRef =

    useRef<number | null>(

      null

    )

  // ========================================

  // CURRENT DIRECTORY

  // ========================================

  const currentDirectory =

    navigationStack.length === 0

      ? null

      : navigationStack[

          navigationStack.length - 1

        ]

  const currentItems =

    currentDirectory?.children ??

    navigation

  const selectedItem =

    currentItems[

      selectedIndex

    ]

  const displayedItem =

    currentItems[

      displayedIndex

    ]

  // ========================================

  // ANIMATION HELPERS

  // ========================================

  function clearAnimationTimers() {

    if (

      timeoutRef.current !==

      null

    ) {

      window.clearTimeout(

        timeoutRef.current

      )

      timeoutRef.current =

        null

    }

    if (

      frameRef.current !==

      null

    ) {

      cancelAnimationFrame(

        frameRef.current

      )

      frameRef.current =

        null

    }

  }

  function runNextFrame(

    callback: () => void

  ) {

    frameRef.current =

      requestAnimationFrame(

        () => {

          frameRef.current =

            requestAnimationFrame(

              callback

            )

        }

      )

  }

  function startPanelEntrance(

    index: number

  ) {

    setDisplayedIndex(

      index

    )

    setPanelPhase(

      "ready"

    )

    runNextFrame(() => {

      setPanelPhase(

        "visible"

      )
      transitionLockedRef.current = false

    })

  }

  // ========================================

  // SELECTION

  // ========================================

  function changeSelection(

    index: number

  ) {

    if (transitionLockedRef.current) return

    if (

      index ===

      selectedIndex

    ) {

      return

    }

    transitionLockedRef.current = true
    clearAnimationTimers()

    setSelectedIndex(

      index

    )

    setPanelPhase(

      "out"

    )

    timeoutRef.current =

      window.setTimeout(

        () => {

          startPanelEntrance(

            index

          )

        },

        PANEL_OUT_DURATION

      )

  }

  // ========================================

  // OPEN PROJECT

  // ========================================

  function openProject(

    project: ProjectId

  ) {
    if (transitionLockedRef.current) return

    if (

      projectPhase !==

      "visible"

    ) {

      return

    }

    transitionLockedRef.current = true
    clearAnimationTimers()

    /*

     * The project directory leaves to

     * the left first.

     */

    setProjectPhase(

      "out-forward"

    )

    timeoutRef.current =

      window.setTimeout(

        () => {

          /*

           * The directory is now invisible,

           * so swap in the README.

           */

          setActiveProject(

            project

          )

          /*

           * Start the README just outside

           * the right-hand side.

           */

          setProjectPhase(

            "ready-forward"

          )

          /*

           * Give React/browser time to paint

           * that starting position before

           * animating it into view.

           */

          runNextFrame(() => {

            setProjectPhase(

              "visible"

            )
              transitionLockedRef.current = false

          })

        },

        PROJECT_OUT_DURATION

      )

  }

  // ========================================

  // CLOSE PROJECT

  // ========================================

  function closeProject() {
    if (transitionLockedRef.current) return

    if (

      !activeProject ||

      projectPhase !==

        "visible"

    ) {

      return

    }

    transitionLockedRef.current = true
    clearAnimationTimers()

    /*

     * README leaves to the right.

     */

    setProjectPhase(

      "out-back"

    )

    timeoutRef.current =

      window.setTimeout(

        () => {

          /*

           * Once invisible, restore the

           * Projects directory.

           *

           * selectedIndex is deliberately

           * NOT changed, so the project the

           * user just viewed stays selected.

           */

          setActiveProject(

            null

          )

          /*

           * Restored directory starts just

           * outside the left-hand side.

           */

          setProjectPhase(

            "ready-back"

          )

          runNextFrame(() => {

            setProjectPhase(

              "visible"

            )
              transitionLockedRef.current = false

          })

        },

        PROJECT_OUT_DURATION

      )

  }

  // ========================================

  // OPEN SELECTED ITEM

  // ========================================

  function openSelectedItem() {
    if (transitionLockedRef.current) return

    if (!selectedItem) {

      return

    }

    // ========================================

    // PROJECT README

    // ========================================

    if (

      currentDirectory?.id ===

        "projects" &&

      isProjectId(

        selectedItem.id

      )

    ) {

      openProject(

        selectedItem.id

      )

      return

    }

    // ========================================

    // MINIGAME EXECUTABLE

    // ========================================

    if (

      isMiniGame(

        selectedItem.id

      )

    ) {

      onLaunchMiniGame(

        selectedItem.id

      )

      return

    }

    // ========================================

    // NORMAL DIRECTORY

    // ========================================

    if (

      !selectedItem.children

        ?.length

    ) {

      return

    }

    transitionLockedRef.current = true
    clearAnimationTimers()

    setDirectoryPhase(

      "out-forward"

    )

    timeoutRef.current =

      window.setTimeout(

        () => {

          setNavigationStack(

            (current) => [

              ...current,

              selectedItem,

            ]

          )

          setSelectedIndex(

            0

          )

          setDisplayedIndex(

            0

          )

          setPanelPhase(

            "visible"

          )

          setDirectoryPhase(

            "ready-forward"

          )

          runNextFrame(

            () => {

              setDirectoryPhase(

                "visible"

              )
              transitionLockedRef.current = false

            }

          )

        },

        DIRECTORY_OUT_DURATION

      )

  }

  // ========================================

  // GO BACK

  // ========================================

  function goBack() {
    if (transitionLockedRef.current) return

    if (

      navigationStack.length ===

      0

    ) {

      return

    }

    transitionLockedRef.current = true
    clearAnimationTimers()

    setDirectoryPhase(

      "out-back"

    )

    timeoutRef.current =

      window.setTimeout(

        () => {

          const directoryBeingClosed =

            navigationStack[

              navigationStack.length -

                1

            ]

          const parentStack =

            navigationStack.slice(

              0,

              -1

            )

          const parentDirectory =

            parentStack.length === 0

              ? null

              : parentStack[

                  parentStack.length -

                    1

                ]

          const parentItems =

            parentDirectory

              ?.children ??

            navigation

          const previousIndex =

            parentItems.findIndex(

              (item) =>

                item.id ===

                directoryBeingClosed.id

            )

          const restoredIndex =

            previousIndex >= 0

              ? previousIndex

              : 0

          setNavigationStack(

            parentStack

          )

          setSelectedIndex(

            restoredIndex

          )

          setDisplayedIndex(

            restoredIndex

          )

          setPanelPhase(

            "visible"

          )

          setDirectoryPhase(

            "ready-back"

          )

          runNextFrame(

            () => {

              setDirectoryPhase(

                "visible"

              )
              transitionLockedRef.current = false

            }

          )

        },

        DIRECTORY_OUT_DURATION

      )

  }

  // ========================================

  // CLICK

  // ========================================

  function handleItemClick(

    index: number

  ) {
    if (transitionLockedRef.current) return

    if (

      index ===

      selectedIndex

    ) {

      const item =

        currentItems[

          index

        ]

      if (!item) {

        return

      }

      // ========================================

      // PROJECT

      // ========================================

      if (

        currentDirectory?.id ===

          "projects" &&

        isProjectId(

          item.id

        )

      ) {

        openProject(

          item.id

        )

        return

      }

      // ========================================

      // MINIGAME

      // ========================================

      if (

        isMiniGame(

          item.id

        )

      ) {

        onLaunchMiniGame(

          item.id

        )

        return

      }

      // ========================================

      // DIRECTORY

      // ========================================

      if (

        item.children

          ?.length

      ) {

        openSelectedItem()

      }

      return

    }

    changeSelection(

      index

    )

  }

  // ========================================

  // KEYBOARD NAVIGATION

  // ========================================

  useEffect(() => {

    function handleKeyDown(

      event: KeyboardEvent

    ) {

      if (event.repeat && (event.key === "Enter" || event.key === "Escape")) return

      // ========================================

      // PROJECT README

      // ========================================

      if (activeProject) {

        if (

          event.key ===

          "Escape"

        ) {

          event.preventDefault()

          closeProject()

        }

        return

      }

      // ========================================

      // MOVE DOWN

      // ========================================

      if (

        event.key ===

        "ArrowDown"

      ) {

        event.preventDefault()

        const nextIndex =

          selectedIndex ===

          currentItems.length -

            1

            ? 0

            : selectedIndex +

              1

        changeSelection(

          nextIndex

        )

        return

      }

      // ========================================

      // MOVE UP

      // ========================================

      if (

        event.key ===

        "ArrowUp"

      ) {

        event.preventDefault()

        const nextIndex =

          selectedIndex === 0

            ? currentItems.length -

              1

            : selectedIndex -

              1

        changeSelection(

          nextIndex

        )

        return

      }

      // ========================================

      // OPEN

      // ========================================

      if (

        event.key ===

        "Enter"

      ) {

        event.preventDefault()

        openSelectedItem()

        return

      }

      // ========================================

      // BACK

      // ========================================

      if (

        event.key ===

        "Escape"

      ) {

        event.preventDefault()

        goBack()

      }

    }

    window.addEventListener(

      "keydown",

      handleKeyDown

    )

    return () => {

      window.removeEventListener(

        "keydown",

        handleKeyDown

      )

    }

  })

  // ========================================

  // CLEANUP

  // ========================================

  useEffect(() => {

    return () => {
      clearAnimationTimers()
      transitionLockedRef.current = false
    }

  }, [])

  useEffect(() => {
    onProjectOpenChange?.(activeProject !== null)
  }, [activeProject, onProjectOpenChange])

  // Measure intrinsic content only; exclude the footer auto margin, which
  // represents animated spare space rather than natural content height.
  useLayoutEffect(() => {
    const view = naturalViewRef.current
    const footer = footerRef.current
    if (!view || !footer || !onContentHeightChange) return

    const measure = () => {
      const viewStyle = window.getComputedStyle(view)
      const footerStyle = window.getComputedStyle(footer)
      const margin = (value: string) => Number.parseFloat(value) || 0
      // The grid stretches with the animated frame, so its rendered height
      // cannot be used as the intrinsic target (that would create feedback).
      const grid = directoryGridRef.current
      const list = directoryListRef.current
      const preview = previewRef.current
      // Read content directly even on mount, before separatorHeight's layout
      // update commits: Container locks the morph target in its layout effect.
      const viewHeight = !activeProject && grid && list && preview
        ? grid.offsetTop +
          Math.max(list.offsetHeight, preview.offsetHeight) + SEPARATOR_PADDING
        : (view.firstElementChild as HTMLElement | null)?.scrollHeight ?? view.scrollHeight
      const height =
        viewHeight +
        margin(viewStyle.marginTop) + margin(viewStyle.marginBottom) +
        footer.offsetHeight +
        margin(footerStyle.marginBottom)
      onContentHeightChange(Math.ceil(height))
    }

    const observer = new ResizeObserver(measure)
    observer.observe(view)
    observer.observe(footer)
    measure()
    return () => observer.disconnect()
  }, [onContentHeightChange, activeProject, separatorHeight])

  // Keep the grid's intrinsic minimum at the taller of the list and preview.
  // Its actual height follows the outer animated frame via flex layout.
  // The preview is replaced at the same point as the existing panel animation.
  useLayoutEffect(() => {
    if (activeProject) return

    const list = directoryListRef.current
    const preview = previewRef.current
    if (!list || !preview) return

    // Measure layout sizes, not scaled screen rectangles. The incoming app
    // starts at scale(.985); feeding that scale back into CSS shrinks both
    // the separator and the frame target until the entrance has finished.
    const updateHeight = () => {
      const height =
        Math.max(
          list.offsetHeight,
          preview.offsetHeight
        ) + SEPARATOR_PADDING * 2

      setSeparatorHeight((previous) =>
        Math.abs(previous - height) < 0.5 ? previous : height
      )
    }


    updateHeight()

    const observer = new ResizeObserver(updateHeight)
    observer.observe(list)
    observer.observe(preview)
    return () => observer.disconnect()
  }, [activeProject, displayedIndex, navigationStack])

  // Measure the intrinsic width of the directory names. The list itself
  // is max-content, so its measurement is independent of the grid column.
  useLayoutEffect(() => {
    if (activeProject) return
    const list = directoryListRef.current
    if (!list) return

    const updateWidth = () => {
      const width = list.offsetWidth + 10
      setListWidth((previous) => Math.abs(previous - width) < 1 ? previous : width)
    }

    const observer = new ResizeObserver(updateWidth)
    observer.observe(list)
    updateWidth()
    return () => observer.disconnect()
  }, [activeProject, navigationStack])

  // ========================================

  // PANEL ANIMATION CLASS

  // ========================================

  function getPanelClassName() {

    if (

      panelPhase ===

      "out"

    ) {

      return "panel-slide-out"

    }

    if (

      panelPhase ===

      "ready"

    ) {

      return "panel-slide-ready"

    }

    return "panel-slide-in"

  }

  // ========================================

  // DIRECTORY ANIMATION CLASS

  // ========================================

  function getDirectoryClassName() {

    if (

      directoryPhase ===

      "out-forward"

    ) {

      return "directory-out-forward"

    }

    if (

      directoryPhase ===

      "ready-forward"

    ) {

      return "directory-ready-forward"

    }

    if (

      directoryPhase ===

      "out-back"

    ) {

      return "directory-out-back"

    }

    if (

      directoryPhase ===

      "ready-back"

    ) {

      return "directory-ready-back"

    }

    return "directory-visible"

  }

  // ========================================

  // PROJECT ANIMATION CLASS

  // ========================================

  function getProjectClassName() {

    if (

      projectPhase ===

      "out-forward"

    ) {

      return "project-view-out-forward"

    }

    if (

      projectPhase ===

      "ready-forward"

    ) {

      return "project-view-ready-forward"

    }

    if (

      projectPhase ===

      "out-back"

    ) {

      return "project-view-out-back"

    }

    if (

      projectPhase ===

      "ready-back"

    ) {

      return "project-view-ready-back"

    }

    return "project-view-visible"

  }

  // ========================================

  // DIRECTORY PATH

  // ========================================

  const directoryPath =

    currentDirectory?.path ??

    "/"

  // ========================================

  // ACTIVE PROJECT

  // ========================================

  function renderActiveProject() {

    if (

      activeProject ===

      "planit"

    ) {

      return (

        <PlanItProject

          onBack={

            closeProject

          }

        />

      )

    }

    if (

      activeProject ===

      "car-rl"

    ) {

      return (

        <SelfDrivingCarProject

          onBack={

            closeProject

          }

        />

      )

    }

    if (

      activeProject ===

      "restaurant"

    ) {

      return (

        <RestaurantManagementProject

          onBack={

            closeProject

          }

        />

      )

    }

    if (

      activeProject ===

      "rekordbox"

    ) {

      return (

        <SpotifyRekordboxProject

          onBack={

            closeProject

          }

        />

      )

    }

    return null

  }

  // ========================================

  // DIRECTORY VIEW

  // ========================================

  function renderDirectoryView() {

    return (

      <div
  className={`
    ${getDirectoryClassName()}
    flex h-full min-h-0 flex-col
  `}
>

        <div className="mb-6 md:mb-8">
          <p
            className="
              mt-1
              font-comic
              text-base
              text-white/85
              md:text-lg
            "
          >
            Select a directory to continue.
          </p>
        </div>

        {/* ======================================== */}

        {/* TERMINAL PROMPT */}

        {/* ======================================== */}

        <div className="mb-7 flex items-center gap-2 font-comic text-base text-white/75">

          <span className="text-white/80">

            $

          </span>

          <span>

            {currentDirectory

              ? `${directoryPath}`

              : "~"}

          </span>

          <span className="animate-pulse text-white">

            _

          </span>

        </div>

        {/* ======================================== */}

        {/* DIRECTORY + PANEL */}

        {/* ======================================== */}

        <div
          ref={directoryGridRef}
className={`relative grid min-h-0 flex-1 content-start items-start grid-cols-[var(--list-width)_1px_minmax(0,1fr)] gap-x-7 overflow-visible ${disableGridMotion ? "" : "transition-[grid-template-columns] duration-[300ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"} max-[680px]:grid-cols-1 max-[680px]:gap-y-7`}
          style={{
            "--list-width": `${listWidth}px`,
            minHeight: separatorHeight > 0
              ? `${separatorHeight - SEPARATOR_PADDING}px`
              : undefined,
          } as CSSProperties}
        >
          {/* Keep the separator at the intrinsic list/preview height rather than
              stretching with the frame. This prevents overshoot on return. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-3 w-px bg-white/15 max-[680px]:hidden"
            style={{
              left: "calc(var(--list-width) + 1.75rem)",
              height: separatorHeight > 0 ? `${separatorHeight}px` : undefined,
            }}
          />

          {/* ======================================== */}

          {/* DIRECTORY LIST */}

          {/* ======================================== */}

          <div ref={directoryListRef} className="col-start-1 row-start-1 w-max min-w-0 max-[680px]:w-full">

            <nav className="flex flex-col items-start">

              {currentItems.map(

                (

                  item,

                  index

                ) => (

                  <div

                    key={

                      item.id

                    }

                    className="w-max"

                  >

                    <PrimaryListItem

                      name={

                        item.name

                      }

                      underline={

                        underlines[

                          index %

                            underlines.length

                        ]

                      }

                      selected={

                        index ===

                        selectedIndex

                      }

                      directory={

                        Boolean(

                          item.children

                            ?.length

                        ) ||

                        (

                          currentDirectory

                            ?.id ===

                            "projects" &&

                          isProjectId(

                            item.id

                          )

                        )

                      }

                      onClick={() =>

                        handleItemClick(

                          index

                        )

                      }

                    />

                  </div>

                )

              )}

            </nav>
          </div>

          {/* ======================================== */}

          {/* CONTENT PANEL */}

          {/* ======================================== */}

<div className="col-start-3 row-start-1 relative min-w-0 max-[680px]:col-start-1 max-[680px]:row-start-2">
  <div ref={previewRef}>
    {displayedItem && (
      <div
        key={`${directoryPath}-${displayedItem.id}`}
        className={getPanelClassName()}
      >
        <SectionPanel
          item={displayedItem}
          onLaunchMiniGame={onLaunchMiniGame}
        />
      </div>
    )}
  </div>
</div>

        </div>

      </div>

    )

  }

  // ========================================

  // RENDER

  // ========================================

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <div className="min-h-0 flex-1 overflow-hidden">
        <div className={`project-view flex h-full min-h-0 flex-col ${getProjectClassName()}`}>
          <div ref={naturalViewRef} className="flex h-full min-h-0 flex-col">
            {activeProject ? renderActiveProject() : renderDirectoryView()}
          </div>
        </div>
      </div>

      <div ref={footerRef} className="mt-auto shrink-0">
        <KeyboardFooter
          projectOpen={activeProject !== null}
          canGoBack={navigationStack.length > 0}
          actionLabel={selectedItem && isMiniGame(selectedItem.id) ? "Run" : "Open"}
        />
      </div>
    </div>
  )
}

export default List
