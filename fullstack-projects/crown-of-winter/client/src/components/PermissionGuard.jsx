
import { Link, Outlet, useParams } from "react-router-dom";
import {
  ArrowLeft,
  LoaderCircle,
  RefreshCw,
  ShieldAlert,
} from "lucide-react";

import { useWorldAccess } from "../context/WorldAccessContext";

import "../pages/WorldMembersPage.css";

function PermissionGuard({ permission, chamberName }) {
  const { worldId } = useParams();

  const {
    status,
    hasPermission,
    error,
    refreshAccess,
  } = useWorldAccess();

  const dashboardPath = `/worlds/${encodeURIComponent(worldId)}/dashboard`;

  // Wait until character permissions are loaded.
  if (status === "loading") {
    return (
      <main className="world-members">
        <div className="world-members__state">
          <LoaderCircle
            size={30}
            className="world-members__spin"
          />

          <h2>Verifying Imperial Clearance</h2>

          <p>
            Checking your authority to enter
            {chamberName ? ` ${chamberName}` : " this chamber"}...
          </p>
        </div>
      </main>
    );
  }

  // Unexpected API errors must not grant access.
  if (status === "error") {
    return (
      <main className="world-members">
        <div className="world-members__state">
          <ShieldAlert size={38} />

          <h2>Clearance Verification Failed</h2>

          <p role="alert">
            {error || "Unable to verify character permissions."}
          </p>

          <button
            type="button"
            className="world-members__invite-button"
            onClick={refreshAccess}
          >
            <RefreshCw size={16} />
            Retry Verification
          </button>

          <Link
            to={dashboardPath}
            className="world-members__back"
          >
            <ArrowLeft size={16} />
            Return to Imperial Command
          </Link>
        </div>
      </main>
    );
  }

  // Only an authorized character may render the chamber.
  if (
    status === "ready" &&
    hasPermission(permission)
  ) {
    return <Outlet />;
  }

  // No assignment or insufficient permissions.
  return (
    <main className="world-members">
      <div className="world-members__state">
        <ShieldAlert size={38} />

        <h2>Access Restricted</h2>

        <p>
          {status === "unassigned"
            ? "You must be assigned a playable character before entering restricted palace chambers."
            : `Your character does not possess the required clearance to enter ${
                chamberName || "this chamber"
              }.`}
        </p>

        <Link
          to={dashboardPath}
          className="world-members__back"
        >
          <ArrowLeft size={16} />
          Return to Imperial Command
        </Link>
      </div>
    </main>
  );
}

export default PermissionGuard;
