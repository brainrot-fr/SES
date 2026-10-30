import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useLang } from "@/context/LanguageContext";
import { Button } from "@/components/shadcn/button";
import PostComposer from "@/features/social/PostComposer";
import { createPost } from "@/features/social/postsApi";
import "@/features/social/PostCreate.css";

export default function PostCreate() {
  const { t } = useLang();
  const navigate = useNavigate();
  const [canSubmit, setCanSubmit] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleCreate = async (post) => {
    setBusy(true);
    try {
      await createPost(post);
      navigate("/social", { replace: true });
    } finally {
      setBusy(false);
    }
  };
  const handleStateChange = useCallback(({ canSubmit: ready, busy: isBusy }) => {
    setCanSubmit(ready);
    setBusy(isBusy);
  }, []);

  return (
    <motion.section
      className="post-create-page"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <header className="post-create-page__header">
        <Button type="submit" form="social-post-compose-form" disabled={!canSubmit || busy}>
          {busy ? t("socialPosting") : t("socialPost")}
        </Button>
      </header>
      <PostComposer onCreate={handleCreate} onStateChange={handleStateChange} />
    </motion.section>
  );
}
