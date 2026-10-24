import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { warBoardApi } from "../services/warBoardApi";
import { useWorldAccess } from "../context/WorldAccessContext";
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  pointerWithin,
  rectIntersection,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

import {
  Snowflake,
  Crown,
  Shield,
  Users,
  AlertTriangle,
  Radio,
  ChevronRight,
  Swords,
  Eye,
  Gem,
  Crosshair,
  MapPin,
  RotateCcw,
} from "lucide-react";

import "./WarTablePage.css";

const regions = [
  {
    id: "snezhnaya",
    name: "Snezhnaya",
    subtitle: "Imperial Homeland",
    influence: 100,
    threat: "Secure",
    forces: "18,420",
    operations: 3,
    x: 54,
    y: 16,
    token: "crown",
  },
  {
    id: "mondstadt",
    name: "Mondstadt",
    subtitle: "Western Territory",
    influence: 42,
    threat: "Observed",
    forces: "1,240",
    operations: 2,
    x: 24,
    y: 37,
    token: "shield",
  },
  {
    id: "liyue",
    name: "Liyue",
    subtitle: "Eastern Trade Zone",
    influence: 58,
    threat: "Stable",
    forces: "2,810",
    operations: 4,
    x: 42,
    y: 50,
    token: "gem",
  },
  {
    id: "inazuma",
    name: "Inazuma",
    subtitle: "Eastern Archipelago",
    influence: 31,
    threat: "Restricted",
    forces: "860",
    operations: 1,
    x: 75,
    y: 46,
    token: "snowflake",
  },
  {
    id: "sumeru",
    name: "Sumeru",
    subtitle: "Southern Intelligence Zone",
    influence: 47,
    threat: "Observed",
    forces: "1,930",
    operations: 3,
    x: 58,
    y: 68,
    token: "eye",
  },
  {
    id: "fontaine",
    name: "Fontaine",
    subtitle: "Western Diplomatic Zone",
    influence: 67,
    threat: "Active",
    forces: "3,460",
    operations: 5,
    x: 30,
    y: 22,
    token: "crosshair",
  },
  {
    id: "natlan",
    name: "Natlan",
    subtitle: "Southern War Zone",
    influence: 36,
    threat: "Critical",
    forces: "4,120",
    operations: 6,
    x: 28,
    y: 73,
    token: "swords",
  },
];

const operations = [
  {
    id: "pale-crown",
    name: "Operation Pale Crown",
    region: "Fontaine",
    commander: "Imperial Command",
    status: "Active",
    priority: "High",
    progress: 72,
  },
  {
    id: "white-silence",
    name: "Operation White Silence",
    region: "Natlan",
    commander: "Field Division VII",
    status: "Active",
    priority: "Critical",
    progress: 46,
  },
  {
    id: "frozen-hand",
    name: "Operation Frozen Hand",
    region: "Liyue",
    commander: "Diplomatic Corps",
    status: "Monitoring",
    priority: "Medium",
    progress: 64,
  },
];

const boardCells = Array.from({ length: 64 }, (_, index) => index);

function RegionIcon({ token }) {
  const props = {
    size: 19,
    strokeWidth: 1.3,
  };

  switch (token) {
    case "crown":
      return <Crown {...props} />;

    case "shield":
      return <Shield {...props} />;

    case "gem":
      return <Gem {...props} />;

    case "snowflake":
      return <Snowflake {...props} />;

    case "eye":
      return <Eye {...props} />;

    case "crosshair":
      return <Crosshair {...props} />;

    case "swords":
      return <Swords {...props} />;

    default:
      return <MapPin {...props} />;
  }
}

// Each cell is identified by its index, from 0 (top-left) to 63 (bottom-right).
const cellForPosition = ({ x, y }) => {
  const column = Math.min(7, Math.max(0, Math.floor(x / 12.5)));
  const row = Math.min(7, Math.max(0, Math.floor(y / 12.5)));
  return row * 8 + column;
};

// Center every token within its square, including on initial load and reset.
const alignedStartingPositions = () =>
  Object.fromEntries(
    regions.map(({ id, x, y }) => {
      const square = cellForPosition({ x, y });
      return [
        id,
        {
          x: ((square % 8) + 0.5) * 12.5,
          y: (Math.floor(square / 8) + 0.5) * 12.5,
        },
      ];
    }),
  );

// Validate server board data and convert grid coordinates to centered percentages.
function positionsFromPieces(pieces) {
  if (!Array.isArray(pieces) || pieces.length !== regions.length) {
    throw new Error("The saved board does not contain all seven nations.");
  }

  const nextPositions = {};
  const occupiedSquares = new Set();
  for (const piece of pieces) {
    const x = piece.grid_x;
    const y = piece.grid_y;
    if (
      !regions.some((region) => region.id === piece.region_id) ||
      !Number.isInteger(x) || x < 0 || x > 7 ||
      !Number.isInteger(y) || y < 0 || y > 7 ||
      nextPositions[piece.region_id] ||
      occupiedSquares.has(y * 8 + x)
    ) {
      throw new Error("The saved board contains invalid piece positions.");
    }
    occupiedSquares.add(y * 8 + x);
    nextPositions[piece.region_id] = {
      x: (x + 0.5) * 12.5,
      y: (y + 0.5) * 12.5,
    };
  }
  return nextPositions;
}

function BoardSquare({ index }) {
  const { setNodeRef, isOver } = useDroppable({ id: `square-${index}` });

  return (
    <span
      ref={setNodeRef}
      className="war-board__cell"
      style={
        isOver
          ? {
              outline: "1px solid rgba(174, 231, 255, 0.72)",
              outlineOffset: "-1px",
            }
          : undefined
      }
    />
  );
}

function DraggableRegion({ region, position, selected, onSelect, disabled }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: region.id, disabled });

  return (
    <button
      ref={setNodeRef}
      type="button"
      aria-label={`Move ${region.name}`}
      className={`war-token ${selected ? "war-token--selected" : ""}`}
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: transform
          ? `translate(-50%, -50%) ${CSS.Translate.toString(transform)}`
          : "translate(-50%, -50%)",
        zIndex: isDragging ? 30 : selected ? 12 : 10,
        touchAction: "none",
        cursor: isDragging ? "grabbing" : "grab",
      }}
      onClick={() => onSelect(region.id)}
      {...attributes}
      {...listeners}
    >
      <span className="war-token__shadow" />
      <span className="war-token__base">
        <span className="war-token__gem">
          <RegionIcon token={region.token} />
        </span>
      </span>
      <span className="war-token__label">{region.name}</span>
    </button>
  );
}

function WarTablePage() {
  const [selectedRegionId, setSelectedRegionId] = useState(regions[0].id);
  const { worldId } = useParams();
  const { status: accessStatus, hasPermission } = useWorldAccess();
  const canManageBoard =
    accessStatus === "ready" && hasPermission("operations.manage");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [positions, setPositions] = useState(alignedStartingPositions);
  const [savedPositions, setSavedPositions] = useState(
    alignedStartingPositions,
  );
  const [boardStatus, setBoardStatus] = useState("loading");
  const [boardError, setBoardError] = useState("");

  // Synchronous flags protect active drags/saves from polling responses.
  const busyRef = useRef(false);
  const interactionVersionRef = useRef(0);
  const activeWorldRef = useRef(worldId);

  useEffect(() => {
    let mounted = true;
    let requestInFlight = false;
    activeWorldRef.current = worldId;
    busyRef.current = false;
    interactionVersionRef.current += 1;

    async function loadBoard(initial = false) {
      if (requestInFlight || busyRef.current) return;
      if (!initial && document.visibilityState === "hidden") return;

      requestInFlight = true;
      const requestVersion = interactionVersionRef.current;
      try {
        const response = await warBoardApi.getBoard(worldId);
        const nextPositions = positionsFromPieces(response?.data?.pieces);

        // A drag or save may have started while this GET was in flight.
        if (
          !mounted ||
          busyRef.current ||
          requestVersion !== interactionVersionRef.current
        ) return;

        setPositions(nextPositions);
        setSavedPositions(nextPositions);
        setBoardStatus("ready");
        setBoardError("");
      } catch (error) {
        if (!mounted || busyRef.current ||
            requestVersion !== interactionVersionRef.current) return;
        if (initial) {
          setBoardError(error?.message || "Unable to retrieve saved board positions.");
          setBoardStatus("error");
        } else {
          setBoardError("Synchronization unavailable; showing last confirmed board.");
        }
      } finally {
        requestInFlight = false;
      }
    }

    loadBoard(true);
    const intervalId = window.setInterval(() => loadBoard(false), 3000);
    return () => {
      mounted = false;
      window.clearInterval(intervalId);
    };
  }, [worldId]);

  const selectedRegion =
    regions.find((region) => region.id === selectedRegionId) || regions[0];
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 6 },
    }),
  );

  async function handleDragEnd({ active, over }) {
    // The drag is finished; let polling resume unless a save begins below.
    busyRef.current = false;
    if (
      boardStatus !== "ready" ||
      !canManageBoard ||
      isSaving ||
      !over ||
      !String(over.id).startsWith("square-")
    )
      return;

    const square = Number(String(over.id).slice("square-".length));
    if (!Number.isInteger(square) || square < 0 || square >= 64) return;

    const regionId = String(active.id);
    if (!regions.some((region) => region.id === regionId)) return;

    const currentSquare = cellForPosition(positions[regionId]);
    if (currentSquare === square) return;

    const occupied = Object.entries(positions).some(
      ([id, position]) =>
        id !== regionId && cellForPosition(position) === square,
    );
    if (occupied) {
      setSaveError("That square is already occupied by another nation.");
      return;
    }

    const gridX = square % 8;
    const gridY = Math.floor(square / 8);
    const previousPositions = positions;
    const nextPositions = {
      ...positions,
      [regionId]: {
        x: (gridX + 0.5) * 12.5,
        y: (gridY + 0.5) * 12.5,
      },
    };

    // Optimistic update; restore the last confirmed position if the API fails.
    busyRef.current = true;
    interactionVersionRef.current += 1;
    setIsSaving(true);
    setSaveError("");
    setPositions(nextPositions);

    try {
      const response = await warBoardApi.movePiece(
        worldId,
        regionId,
        gridX,
        gridY,
      );
      if (response?.success !== true) {
        throw new Error(
          response?.message || "Unable to save the board movement.",
        );
      }
      if (activeWorldRef.current === worldId) {
        setSavedPositions(nextPositions);
      }
    } catch (error) {
      if (activeWorldRef.current === worldId) {
        setPositions(previousPositions);
        setSaveError(error?.message || "Unable to save the board movement.");
      }
    } finally {
      if (activeWorldRef.current === worldId) {
        busyRef.current = false;
        setIsSaving(false);
      }
    }
  }

  function resetBoard() {
    if (boardStatus !== "ready" || isSaving) return;
    setPositions({ ...savedPositions });
    setSaveError("");
    setSelectedRegionId(regions[0].id);
  }

  return (
    <main className="war-table-page">
      {/* =====================================
          HEADER
      ===================================== */}

      <header className="war-table-page__header">
        <div>
          <span className="war-table-page__eyebrow">
            Imperial Strategic Chamber
          </span>

          <h1>War Table</h1>

          <p>
            Her Majesty&apos;s strategic board for imperial deployments, foreign
            influence and classified military operations.
          </p>
        </div>

        <div className="war-table-page__network">
          <Radio size={18} />

          <div>
            <span>War Chamber</span>
            <strong>Sealed</strong>
          </div>
        </div>
      </header>

      {/* =====================================
          METRICS
      ===================================== */}

      <section className="war-table-page__metrics">
        <article>
          <Crosshair size={17} />

          <div>
            <span>Active Operations</span>
            <strong>24</strong>
          </div>
        </article>

        <article>
          <Users size={17} />

          <div>
            <span>Deployed Forces</span>
            <strong>32,840</strong>
          </div>
        </article>

        <article>
          <Shield size={17} />

          <div>
            <span>Secured Regions</span>
            <strong>03</strong>
          </div>
        </article>

        <article>
          <AlertTriangle size={17} />

          <div>
            <span>Critical Zones</span>
            <strong>02</strong>
          </div>
        </article>
      </section>

      {/* =====================================
          WAR CHAMBER
      ===================================== */}

      <section className="war-table-page__command">
        {/* ===================================
            IMPERIAL BOARD
        =================================== */}

        <article className="war-board-panel">
          <div className="war-board-panel__header">
            <div>
              <span>Her Majesty&apos;s Chamber</span>
              <h2>Imperial Strategy Board</h2>
            </div>

            <Crown size={18} />
          </div>

          <div className="war-board-stage">
            {/* atmospheric table glow */}
            <div className="war-board-stage__glow" />

            {/* ornate board */}
            <div className="war-board">
              {/* ornamental corners */}
              <span className="war-board__corner war-board__corner--tl" />
              <span className="war-board__corner war-board__corner--tr" />
              <span className="war-board__corner war-board__corner--bl" />
              <span className="war-board__corner war-board__corner--br" />

              {/* outer decoration */}
              <div className="war-board__frame">
                <div className="war-board__crest war-board__crest--top">
                  <Snowflake size={24} strokeWidth={1} />
                </div>

                <div className="war-board__crest war-board__crest--bottom">
                  <Crown size={22} strokeWidth={1} />
                </div>

                {/* board surface — draggable strategic tokens */}
                <DndContext
                  sensors={sensors}
                  collisionDetection={(args) => {
                    const pointerHits = pointerWithin(args);
                    return pointerHits.length
                      ? pointerHits
                      : rectIntersection(args);
                  }}
                  onDragStart={({ active }) => {
                    if (
                      boardStatus === "ready" &&
                      canManageBoard &&
                      !isSaving
                    ) {
                      busyRef.current = true;
                      interactionVersionRef.current += 1;
                      setSelectedRegionId(active.id);
                    }
                  }}
                  onDragEnd={handleDragEnd}
                  onDragCancel={() => { busyRef.current = false; }}
                >
                  <div className="war-board__surface">
                    <div className="war-board__cells">
                      {boardCells.map((cell) => (
                        <BoardSquare key={cell} index={cell} />
                      ))}
                    </div>

                    <div className="war-board__seal">
                      <div className="war-board__seal-ring">
                        <Snowflake size={54} strokeWidth={0.7} />
                      </div>
                    </div>

                    {regions.map((region) => (
                      <DraggableRegion
                        key={region.id}
                        region={region}
                        position={positions[region.id]}
                        selected={selectedRegionId === region.id}
                        onSelect={setSelectedRegionId}
                        disabled={
                          boardStatus !== "ready" || !canManageBoard || isSaving
                        }
                      />
                    ))}
                  </div>
                </DndContext>
              </div>
            </div>

            {boardStatus === "loading" && (
              <p role="status" style={{ color: "#99d8ed", fontSize: "11px" }}>
                Loading saved Imperial Strategy Board...
              </p>
            )}
            {boardStatus === "error" && (
              <p role="alert" style={{ color: "#e8a2a2", fontSize: "11px" }}>
                {boardError} Showing the default layout; board movement is
                unavailable.
              </p>
            )}
            {boardStatus === "ready" && (
              <p role="status" style={{ color: "#779aa9", fontSize: "10px" }}>
                {isSaving
                  ? "Saving movement to Imperial records..."
                  : canManageBoard
                    ? "Board synchronizes every 3 seconds. Drag to save movements to PostgreSQL."
                    : accessStatus === "loading"
                      ? "Verifying movement permissions..."
                      : "Board in view-only mode. Operations management clearance required to move pieces."}
              </p>
            )}
            {saveError && (
              <p role="alert" style={{ color: "#e8a2a2", fontSize: "11px" }}>
                {saveError}
              </p>
            )}

            <div className="war-board-stage__caption">
              <span>
                <Snowflake size={12} />
                Cryo Strategic Matrix
              </span>

              <button
                type="button"
                onClick={resetBoard}
                title="Restore latest successfully saved positions"
                disabled={boardStatus !== "ready"}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  border: "1px solid rgba(151, 207, 230, 0.18)",
                  background: "rgba(9, 29, 46, 0.72)",
                  color: "#99d8ed",
                  padding: "7px 10px",
                  font: "inherit",
                  fontSize: "8px",
                  letterSpacing: "0.1em",
                  cursor: "pointer",
                }}
              >
                <RotateCcw size={13} /> Reset Board
              </button>
            </div>
          </div>
        </article>

        {/* ===================================
            SELECTED REGION
        =================================== */}

        <aside className="war-region-panel">
          <div className="war-region-panel__header">
            <div>
              <span>Selected Piece</span>
              <h2>{selectedRegion.name}</h2>
            </div>

            <div className="war-region-panel__selected-icon">
              <RegionIcon token={selectedRegion.token} />
            </div>
          </div>

          <div className="war-region-panel__body">
            <span className="war-region-panel__subtitle">
              {selectedRegion.subtitle}
            </span>

            {/* influence */}

            <div className="war-region-panel__influence">
              <div>
                <span>Imperial Influence</span>

                <strong>{selectedRegion.influence}%</strong>
              </div>

              <div className="war-region-panel__bar">
                <span
                  style={{
                    width: `${selectedRegion.influence}%`,
                  }}
                />
              </div>
            </div>

            {/* stats */}

            <div className="war-region-panel__stats">
              <div>
                <span>Threat Status</span>

                <strong>{selectedRegion.threat}</strong>
              </div>

              <div>
                <span>Fatui Forces</span>

                <strong>{selectedRegion.forces}</strong>
              </div>

              <div>
                <span>Operations</span>

                <strong>
                  {String(selectedRegion.operations).padStart(2, "0")}
                </strong>
              </div>
            </div>

            {/* royal directive */}

            <div className="war-region-panel__directive">
              <div className="war-region-panel__directive-icon">
                <Crown size={17} />
              </div>

              <div>
                <span>Royal Directive</span>

                <p>
                  Maintain strategic pressure and continue imperial observation
                  throughout {selectedRegion.name}.
                </p>
              </div>
            </div>

            {/* seal */}

            <div className="war-region-panel__seal">
              <Snowflake size={35} strokeWidth={0.8} />

              <div>
                <span>Authority</span>
                <strong>By Order of the Crown</strong>
              </div>
            </div>
          </div>
        </aside>
      </section>

      {/* =====================================
          OPERATIONS
      ===================================== */}

      <section className="war-table-page__operations">
        <div className="war-table-page__section-heading">
          <div>
            <span>Current Campaigns</span>
            <h2>Imperial Operations</h2>
          </div>

          <span>03 Priority Orders</span>
        </div>

        <div className="war-table-page__operation-grid">
          {operations.map((operation) => (
            <article key={operation.id} className="war-operation">
              <div className="war-operation__top">
                <div className="war-operation__icon">
                  <Swords size={19} />
                </div>

                <span
                  className={`war-operation__priority war-operation__priority--${operation.priority.toLowerCase()}`}
                >
                  {operation.priority}
                </span>
              </div>

              <div className="war-operation__content">
                <span>{operation.region}</span>

                <h3>{operation.name}</h3>

                <p>Commanded by {operation.commander}</p>
              </div>

              <div className="war-operation__progress">
                <div>
                  <span>{operation.status}</span>

                  <strong>{operation.progress}%</strong>
                </div>

                <div className="war-operation__bar">
                  <span
                    style={{
                      width: `${operation.progress}%`,
                    }}
                  />
                </div>
              </div>

              <button type="button">
                Review Order
                <ChevronRight size={14} />
              </button>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

export default WarTablePage;
