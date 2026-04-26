import { motion } from 'framer-motion';

const PageTransition = ({ children }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
};

export const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

export const staggerItem = {
  hidden: { opacity: 0, y: 10 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.3 }
  }
};

export const hoverEffect = {
  whileHover: { scale: 1.02, y: -2, transition: { duration: 0.2 } },
  whileTap: { scale: 0.98 }
};

export default PageTransition;
