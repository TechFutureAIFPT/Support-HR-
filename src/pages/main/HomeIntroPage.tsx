import React from 'react';
import { AnimatePresence, motion, useReducedMotion, type Variants } from 'framer-motion';
import HomePage from '@/pages/main/HomePage';

type HomeIntroPageProps = React.ComponentProps<typeof HomePage>;

const introEase = [0.76, 0, 0.24, 1] as const;

let hasPlayedHomeIntro = false;

const homeRevealVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.12,
      duration: 0.72,
      ease: introEase,
    },
  },
};

const staticRevealVariants: Variants = {
  hidden: { opacity: 1, y: 0 },
  visible: { opacity: 1, y: 0 },
};

function IntroPreloader({ shouldReduceMotion }: { shouldReduceMotion: boolean }) {
  return (
    <motion.div
      role="status"
      aria-live="polite"
      aria-label="Đang khởi tạo Support HR"
      initial={{ y: 0 }}
      animate={{ y: 0 }}
      exit={shouldReduceMotion ? { opacity: 0 } : { y: '-100%' }}
      transition={
        shouldReduceMotion
          ? { duration: 0.15 }
          : { duration: 0.9, ease: introEase }
      }
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#fafbfe] px-6"
    >
      <div className="w-full max-w-md text-center">
        <p className="text-sm font-semibold tracking-[0.08em] text-slate-900 sm:text-base">
          Support HR - AI Recruiting Intelligence
        </p>
        <div className="mx-auto mt-5 h-px w-44 overflow-hidden bg-slate-200 sm:w-52">
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{
              duration: shouldReduceMotion ? 0.15 : 1.45,
              ease: introEase,
            }}
            className="h-full origin-left bg-blue-600"
          />
        </div>
      </div>
    </motion.div>
  );
}

const HomeIntroPage: React.FC<HomeIntroPageProps> = (props) => {
  const shouldReduceMotion = Boolean(useReducedMotion());
  const [isPreloaderVisible, setIsPreloaderVisible] = React.useState(() => !hasPlayedHomeIntro);

  React.useEffect(() => {
    if (!isPreloaderVisible) return undefined;

    hasPlayedHomeIntro = true;
    const timer = window.setTimeout(
      () => setIsPreloaderVisible(false),
      shouldReduceMotion ? 180 : 1500,
    );

    return () => window.clearTimeout(timer);
  }, [isPreloaderVisible, shouldReduceMotion]);

  return (
    <>
      <AnimatePresence>
        {isPreloaderVisible ? (
          <IntroPreloader key="supporthr-preloader" shouldReduceMotion={shouldReduceMotion} />
        ) : null}
      </AnimatePresence>

      <motion.div
        aria-hidden={isPreloaderVisible || undefined}
        initial={isPreloaderVisible ? 'hidden' : false}
        animate={isPreloaderVisible ? 'hidden' : 'visible'}
        variants={shouldReduceMotion ? staticRevealVariants : homeRevealVariants}
        className={isPreloaderVisible ? 'invisible pointer-events-none' : 'visible'}
      >
        <HomePage {...props} />
      </motion.div>
    </>
  );
};

export default HomeIntroPage;
