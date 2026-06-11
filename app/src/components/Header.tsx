import { useAuth } from "../auth/useAuth";
import { useCampaign } from "../state/campaign";
import { initials } from "../lib/validation";
import { ClockIcon, GearIcon, LogoutIcon, StarIcon } from "./icons";

export default function Header({
  onOpenHistory,
  onOpenSettings,
}: {
  onOpenHistory: () => void;
  onOpenSettings: () => void;
}) {
  const { user, signOut, isReal } = useAuth();
  const { history } = useCampaign();

  return (
    <header className="header">
      <div className="header__inner">
        <div className="brand">
          <span className="brand__mark">
            <StarIcon size={22} />
          </span>
          <span className="brand__title">
            HEINEKEN Myanmar
            <small>Invitation Sender</small>
          </span>
        </div>

        <div className="header__spacer" />

        {user && (
          <>
            <button
              className="iconbtn iconbtn--badge"
              data-count={history.length}
              onClick={onOpenHistory}
              title="Send history"
            >
              <ClockIcon />
            </button>
            <button className="iconbtn" onClick={onOpenSettings} title="Settings">
              <GearIcon />
            </button>

            <div className="identity" title={`Sending as ${user.email}`}>
              <span className="avatar">{initials(user.name)}</span>
              <span className="identity__meta">
                <span className="identity__name">
                  {user.name}
                  <span className={`mode-dot ${isReal ? "mode-dot--live" : "mode-dot--demo"}`} title={isReal ? "Live — real sending" : "Demo — simulated"} />
                </span>
                <span className="identity__mail">{user.email}</span>
              </span>
            </div>
            <button className="btn btn--subtle" onClick={signOut} title="Sign out">
              <LogoutIcon />
            </button>
          </>
        )}
      </div>
    </header>
  );
}
