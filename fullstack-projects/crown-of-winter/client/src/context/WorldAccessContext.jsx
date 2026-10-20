
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { accessApi } from "../services/accessApi";

const WorldAccessContext = createContext(null);

export function WorldAccessProvider({ worldId, children }) {
  const [state, setState] = useState({
    worldId: null,
    status: "loading",
    character: null,
    permissions: [],
    error: "",
  });

  const [refreshKey, setRefreshKey] = useState(0);

  const refreshAccess = useCallback(() => {
    setRefreshKey((current) => current + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadAccess() {
      try {
        const response = await accessApi.getMyPermissions(worldId);

        if (cancelled) return;

        setState({
          worldId,
          status: "ready",
          character: response.data.character,
          permissions: response.data.permissions ?? [],
          error: "",
        });
      } catch (error) {
        if (cancelled) return;

        if (error.status === 403) {
          setState({
            worldId,
            status: "unassigned",
            character: null,
            permissions: [],
            error: "",
          });

          return;
        }

        setState({
          worldId,
          status: "error",
          character: null,
          permissions: [],
          error:
            error.message ||
            "Unable to load character permissions.",
        });
      }
    }

    loadAccess();

    return () => {
      cancelled = true;
    };
  }, [worldId, refreshKey]);

  const currentState =
    state.worldId === worldId
      ? state
      : {
          worldId,
          status: "loading",
          character: null,
          permissions: [],
          error: "",
        };

  const roles = currentState.character?.roles ?? [];

  const isSovereign =
    currentState.status === "ready" &&
    currentState.character?.isSovereign === true;

  function hasRole(roleCode) {
    return (
      currentState.status === "ready" &&
      roles.includes(roleCode)
    );
  }

  function hasPermission(permissionCode) {
    if (currentState.status !== "ready") {
      return false;
    }

    return (
      isSovereign ||
      currentState.permissions.includes(permissionCode)
    );
  }

  return (
    <WorldAccessContext.Provider
      value={{
        ...currentState,
        roles,
        isSovereign,
        hasRole,
        hasPermission,
        refreshAccess,
      }}
    >
      {children}
    </WorldAccessContext.Provider>
  );
}

// This hook intentionally shares the provider module's context and API.
// eslint-disable-next-line react-refresh/only-export-components
export function useWorldAccess() {
  const context = useContext(WorldAccessContext);

  if (!context) {
    throw new Error(
      "useWorldAccess must be used inside WorldAccessProvider."
    );
  }

  return context;
}
