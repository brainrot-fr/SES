import { ArrowUp, Pause, Play, SkipBack, SkipForward } from "lucide-react";

function MediaIcon({ Icon, size = 20, className = "", title, ...props }) {
  return (
    <Icon
      size={size}
      className={className}
      fill={Icon === Play || Icon === Pause ? "currentColor" : "none"}
      aria-hidden={title ? undefined : "true"}
      role={title ? "img" : undefined}
      aria-label={title}
      {...props}
    />
  );
}

export function PrevIcon(props) {
  return <MediaIcon Icon={SkipBack} {...props} />;
}

export function NextIcon(props) {
  return <MediaIcon Icon={SkipForward} {...props} />;
}

export function TopArrowIcon(props) {
  return <MediaIcon Icon={ArrowUp} {...props} />;
}

export function PlayIcon(props) {
  return <MediaIcon Icon={Play} {...props} />;
}

export function PauseIcon(props) {
  return <MediaIcon Icon={Pause} {...props} />;
}

export default { PrevIcon, NextIcon, PlayIcon, PauseIcon, TopArrowIcon };
