import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useLang } from "../../context/LanguageContext";
import IconButton from "../../components/ui/IconButton";
import PostComposer from "./PostComposer";
import { createPost } from "./postsApi";
import "./PostCreate.css";

export default function PostCreate() {
  const { t } = useLang();
  const navigate = useNavigate();

  const handleCreate = async (post) => {
    await createPost(post);
    navigate("/social", { replace: true });
  };

  return (
    <motion.section
      className="post-create-page"
      aria-labelledby="post-create-title"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <header className="post-create-page__header">
        <IconButton icon="back" label={t("goBack")} onClick={() => navigate("/social")} />
        <div>
          <p className="social-feed__eyebrow">{t("socialEyebrow")}</p>
          <h1 id="post-create-title">{t("socialCreatePost")}</h1>
        </div>
        <span aria-hidden="true" />
      </header>
      <div className="post-create-page__form">
        <PostComposer onCreate={handleCreate} />
      </div>
    </motion.section>
  );
}
