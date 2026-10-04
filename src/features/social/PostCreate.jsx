import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useLang } from "../../context/LanguageContext";
import { Button } from "../../components/shadcn/button";
import AppIcon from "../../components/icons/AppIcon";
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
        <Button type="button" variant="ghost" size="icon" aria-label={t("goBack")} onClick={() => navigate("/social")}><AppIcon name="back" /></Button>
        <h1 id="post-create-title">{t("socialCreatePost")}</h1>
        <Button type="submit" form="social-post-compose-form">{t("socialPost")}</Button>
      </header>
      <PostComposer onCreate={handleCreate} />
    </motion.section>
  );
}
