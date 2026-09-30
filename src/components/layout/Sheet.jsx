import Modal from "../ui/Modal";

export default function Sheet({ className = "", ...props }) {
  return <Modal className={`layout-sheet${className ? ` ${className}` : ""}`} {...props} />;
}
