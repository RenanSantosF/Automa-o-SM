import { motion } from 'framer-motion';

const container = (delay = 0, speed = 0.03) => ({
  hidden: {},
  visible: {
    transition: {
      delayChildren: delay,
      staggerChildren: speed,
    },
  },
});

const letter = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      ease: 'easeOut',
    },
  },
};

export default function TypingText({
  text,
  as: Component = 'p',
  className,
  delay = 0,
  speed = 0.03,
}) {
  if (!text) return null;

  return (
    <motion.div
      variants={container(delay, speed)}
      initial="hidden"
      animate="visible"
      className={className}
    >
      <Component>
        {text.split('').map((char, index) => (
          <motion.span key={index} variants={letter}>
            {char === ' ' ? '\u00A0' : char}
          </motion.span>
        ))}
      </Component>
    </motion.div>
  );
}
