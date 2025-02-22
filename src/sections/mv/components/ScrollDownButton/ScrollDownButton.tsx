import type React from "react";
import styles from "./ScrollDownButton.module.css";

const ScrollDownButton: React.FC = () => {
  const handleClick = () => {
    window.scrollTo({
      top: window.innerHeight,
      behavior: "smooth",
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={styles.scrollDownButton}
      aria-label="Scroll Down"
    >
      <span className={styles.arrow}> </span>
    </button>
  );
};

export default ScrollDownButton;
