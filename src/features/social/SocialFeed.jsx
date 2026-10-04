import { useLocation, useNavigate } from "react-router-dom";
import { useLang } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import { useSocialFeed } from "./useSocialFeed";
import { FeedList, ReelsViewport } from "./SocialFeedViews";
import "./socialFeed.css";

export default function SocialFeed({ mode = "posts" }) {
  const { t } = useLang();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isReels = mode === "reels";
  const prioritizedReelId = isReels
    ? new URLSearchParams(location.search).get("reel")
    : null;
  const prioritizedPostId = !isReels
    ? new URLSearchParams(location.search).get("post")
    : null;
  const feed = useSocialFeed({
    mode,
    user,
    prioritizedPostId,
    prioritizedReelId,
    t,
  });

  return (
    <section className={`social-feed${isReels ? " social-feed--reels" : ""} ${isReels ? "" : "mx-auto w-full max-w-[var(--measure-feed)] px-4 py-4 lg:max-w-6xl lg:px-0"}`}>
      {isReels
        ? <ReelsViewport t={t} user={user} navigate={navigate} feed={feed} />
        : <FeedList t={t} user={user} navigate={navigate} feed={feed} />}
    </section>
  );
}
