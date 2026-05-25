import { useEffect } from "react";

const DMCA_STATUS_URL =
  "//www.dmca.com/Protection/Status.aspx?ID=9854c96e-f6a0-42dc-871a-d17d7f180c4f";
const DMCA_BADGE_IMAGE_URL =
  "https://images.dmca.com/Badges/dmca_protected_sml_120m.png?ID=9854c96e-f6a0-42dc-871a-d17d7f180c4f";
const DMCA_HELPER_SCRIPT_URL =
  "https://images.dmca.com/Badges/DMCABadgeHelper.min.js";
const DMCA_HELPER_SCRIPT_ID = "dmca-badge-helper-script";

type DmcaBadgeProps = {
  note?: string;
  className?: string;
  centered?: boolean;
};

export default function DmcaBadge({
  note,
  className = "",
  centered = false,
}: DmcaBadgeProps) {
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (document.getElementById(DMCA_HELPER_SCRIPT_ID)) return;

    const script = document.createElement("script");
    script.id = DMCA_HELPER_SCRIPT_ID;
    script.src = DMCA_HELPER_SCRIPT_URL;
    script.async = true;
    document.body.appendChild(script);
  }, []);

  return (
    <div
      className={[
        "border border-white/[0.08] bg-white/[0.02] px-3 py-3",
        centered ? "text-center" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <a
        href={DMCA_STATUS_URL}
        title="DMCA.com Protection Status"
        className="dmca-badge inline-flex"
        target="_blank"
        rel="noopener noreferrer"
      >
        <img
          src={DMCA_BADGE_IMAGE_URL}
          alt="DMCA.com Protection Status"
          className="h-auto w-[120px]"
          loading="lazy"
        />
      </a>
      {note ? (
        <p className="mt-2 text-xs leading-5 text-zinc-500">{note}</p>
      ) : null}
    </div>
  );
}
