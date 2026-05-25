import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

const HERO_SYSTEM_PANELS = [
  {
    label: "WORKFLOW // JD",
    dotClass: "bg-cyan-400",
    accentClass: "text-cyan-400",
    lines: [
      "[ROLE] Chot mot vi tri can tuyen",
      "[MUST] Giu cac tieu chi can co",
      "[FLOW] Bat dau tu mot context ro rang",
    ],
  },
  {
    label: "IMPORT // CV",
    dotClass: "bg-emerald-400",
    accentClass: "text-emerald-400",
    lines: [
      "[SOURCE] Upload file hoac Google Drive",
      "[OCR] Co the doc tai lieu scan",
      "[QUEUE] Dua ve cung mot workflow screening",
    ],
  },
  {
    label: "REVIEW // SCORE",
    dotClass: "bg-sky-400",
    accentClass: "text-sky-400",
    lines: [
      "[VIEW] So sanh CV voi cung mot JD",
      "[NOTE] Giu lai ly do de xep shortlist",
      "[GAP] De recruiter kiem tra them khi can",
    ],
  },
  {
    label: "TEAM // HANDOFF",
    dotClass: "bg-violet-400",
    accentClass: "text-violet-400",
    lines: [
      "[SHARE] Hiring manager nhin duoc context",
      "[SHORTLIST] Giam viec tong hop lai thu cong",
      "[NEXT] Chuyen sang vong phong van de dang hon",
    ],
  },
  {
    label: "MEMORY // SESSION",
    dotClass: "bg-cyan-400",
    accentClass: "text-cyan-400",
    lines: [
      "[STATE] Luu trang thai gan nhat cua workflow",
      "[RESET] Session cu tu het han sau khi khong dung",
      "[RETURN] F5 thong thuong van giu duoc tien trinh",
    ],
  },
  {
    label: "TRUST // DOCS",
    dotClass: "bg-emerald-400",
    accentClass: "text-emerald-400",
    lines: [
      "[PAGE] Pricing, Security, FAQ, Demo",
      "[BUYER] De tim trong 1-2 lan click",
      "[B2B] Noi dung uu tien cho doi ngu doanh nghiep",
    ],
  },
];

const HERO_HEADLINE_LINES = [
  { text: "Screening AI cho" },
  { text: "doi ngu HR nghiem tuc." },
];

const HERO_VIEWPORT = { once: true, amount: 0.2 };
const HERO_TRANSITION = { duration: 0.72, ease: [0.22, 1, 0.36, 1] as const };

interface LandingHeroProps {
  onPrimaryAction: () => void;
  onSecondaryAction: () => void;
  primaryLabel: string;
}

function TypeLine({
  text,
  lineDelay,
  reduceMotion,
  accentClass,
}: {
  text: string;
  lineDelay: number;
  reduceMotion: boolean;
  accentClass: string;
}) {
  const [displayed, setDisplayed] = React.useState(reduceMotion ? text : "");
  const [done, setDone] = React.useState(reduceMotion);

  React.useEffect(() => {
    if (reduceMotion) {
      setDisplayed(text);
      setDone(true);
      return;
    }

    setDisplayed("");
    setDone(false);
    let intervalId: number | undefined;
    let timerId: number | undefined;
    let index = 0;

    const runTypewriter = () => {
      intervalId = window.setInterval(() => {
        index += 1;
        setDisplayed(text.slice(0, index));
        if (index >= text.length) {
          window.clearInterval(intervalId);
          setDone(true);
        }
      }, 18);
    };

    timerId = window.setTimeout(runTypewriter, lineDelay);

    return () => {
      if (timerId) window.clearTimeout(timerId);
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [text, lineDelay, reduceMotion]);

  const match = displayed.match(/^(\[[A-Z0-9_-]+\])(.*)$/);

  return (
    <span className="relative block supporthr-mono text-[12px] font-medium leading-6 xl:text-[13px]">
      {match ? (
        <>
          <span className={`${accentClass} font-semibold`}>{match[1]}</span>
          <span className="ml-1.5 text-zinc-300">{match[2]}</span>
        </>
      ) : (
        <span className="text-zinc-300">{displayed}</span>
      )}
      {!done ? (
        <span
          className="ml-[1.5px] inline-block h-[1.1em] w-[1.5px] animate-[supporthr-terminal-blink_0.9s_steps(1)_infinite] bg-zinc-300 align-middle"
          aria-hidden="true"
        />
      ) : null}
    </span>
  );
}

function SystemPanel({
  label,
  dotClass,
  accentClass,
  lines,
  reduceMotion,
}: {
  label: string;
  dotClass: string;
  accentClass: string;
  lines: string[];
  reduceMotion: boolean;
}) {
  return (
    <motion.div
      className="relative flex h-full flex-col justify-between overflow-hidden bg-black/90 p-4 xl:p-5"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.25 }}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-zinc-900" />

      <div className="relative flex items-center justify-between">
        <span className="supporthr-mono text-[10px] font-bold uppercase tracking-[0.24em] text-zinc-500">
          {label}
        </span>
        <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} />
      </div>

      <div className="relative mt-5 space-y-1">
        {lines.map((line, index) => (
          <TypeLine
            key={line}
            text={line}
            lineDelay={reduceMotion ? 0 : index * 120}
            reduceMotion={reduceMotion}
            accentClass={accentClass}
          />
        ))}
      </div>
    </motion.div>
  );
}

function HeadlineLine({ text }: { text: string }) {
  return (
    <span className="relative block leading-[1.02] sm:whitespace-nowrap">
      <motion.span
        className="relative block text-white"
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      >
        {text}
      </motion.span>
    </span>
  );
}

export default function LandingHero({
  onPrimaryAction,
  onSecondaryAction,
  primaryLabel,
}: LandingHeroProps) {
  const reduceMotion = useReducedMotion();

  return (
    <section id="hero" className="relative overflow-hidden bg-black pt-0">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(255,255,255,0.05),transparent_20%),linear-gradient(180deg,#000000_0%,#010101_56%,#000000_100%)]" />
      <div className="pointer-events-none absolute inset-0 supporthr-grid-mask opacity-18" />
      <div className="pointer-events-none absolute inset-y-0 left-0 w-full bg-[linear-gradient(90deg,rgba(0,0,0,1)_0%,rgba(0,0,0,0.992)_34%,rgba(0,0,0,0.972)_48%,rgba(0,0,0,0.9)_62%,rgba(0,0,0,0.56)_80%,transparent_94%)]" />
      <div className="pointer-events-none absolute left-[-4rem] top-[4rem] z-[1] h-[36rem] w-[74rem] max-w-[80%] bg-[radial-gradient(circle_at_18%_16%,rgba(255,255,255,0.06)_0%,rgba(0,0,0,0.9)_34%,rgba(0,0,0,0.98)_68%,transparent_100%)] blur-[10px]" />

      <div className="w-full">
        <div className="relative min-h-[540px] sm:min-h-[580px] lg:min-h-[610px] xl:min-h-[640px]">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 hidden overflow-hidden opacity-[0.9] lg:grid lg:grid-cols-3 lg:grid-rows-2"
          >
            {HERO_SYSTEM_PANELS.map((panel, index) => (
              <div
                key={panel.label}
                className={`border-zinc-900 ${
                  index % 3 !== 2 ? "border-r" : ""
                } ${index < HERO_SYSTEM_PANELS.length - 3 ? "border-b" : ""}`}
              >
                <SystemPanel {...panel} reduceMotion={reduceMotion ?? false} />
              </div>
            ))}
          </div>

          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 20 }}
            whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            viewport={HERO_VIEWPORT}
            transition={HERO_TRANSITION}
            className="relative z-10 max-w-[46rem] px-6 py-12 sm:px-10 sm:py-14 lg:max-w-[60%] lg:px-16 lg:py-14 xl:max-w-[62%] xl:py-16"
          >
            <div className="pointer-events-none absolute bottom-[-2.5rem] left-[-2.25rem] right-0 top-[-2.5rem] -z-10 bg-[radial-gradient(circle_at_22%_24%,rgba(5,14,26,0.98)_0%,rgba(0,0,0,0.94)_26%,rgba(0,0,0,0.74)_54%,rgba(0,0,0,0.34)_76%,transparent_100%)]" />
            <div className="pointer-events-none absolute bottom-[-1.5rem] left-[-2.5rem] right-0 top-[11.25rem] -z-10 bg-[linear-gradient(90deg,rgba(0,0,0,0.98)_0%,rgba(0,0,0,0.88)_34%,rgba(0,0,0,0.54)_62%,rgba(0,0,0,0.12)_88%,transparent_100%)] blur-[3px]" />

            <motion.div
              initial={reduceMotion ? false : { opacity: 0, x: -12 }}
              whileInView={reduceMotion ? undefined : { opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="mb-4 flex items-center xl:mb-5"
            >
              <span className="supporthr-mono text-[11px] font-bold uppercase tracking-[0.32em] text-[#f5d6bb]/90">
                RECRUITMENT WORKSPACE
              </span>
            </motion.div>

            <h1 className="home-hero-heading supporthr-display max-w-[20ch] text-[clamp(3.5rem,6vw,6.5rem)] font-bold leading-[1.02] tracking-normal">
              {HERO_HEADLINE_LINES.map((line) => (
                <HeadlineLine key={line.text} text={line.text} />
              ))}
            </h1>

            <p className="home-hero-copy mt-6 max-w-[43rem] text-[clamp(1rem,1.18vw,1.18rem)] font-light leading-[1.75] tracking-normal text-zinc-400 xl:mt-7">
              Support HR tap trung vao mot bai toan rat cu the: lay JD, nap CV, doi chieu, va tao shortlist co the review
              duoc de recruiter va hiring manager ra quyet dinh nhanh hon.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3 xl:mt-9">
              <motion.button
                type="button"
                whileHover={reduceMotion ? undefined : { scale: 1.02 }}
                whileTap={reduceMotion ? undefined : { scale: 0.97 }}
                onClick={onPrimaryAction}
                className="group relative inline-flex h-[3.1rem] items-center gap-3.5 overflow-hidden bg-white px-7 text-[12px] font-bold uppercase tracking-[0.14em] text-black shadow-[0_20px_50px_rgba(255,255,255,0.12)] transition-all duration-200 hover:bg-zinc-100 hover:shadow-[0_24px_60px_rgba(255,255,255,0.2)] sm:h-[3.35rem] sm:px-9 sm:text-[13px]"
              >
                <span className="relative z-10">{primaryLabel}</span>
                <ArrowUpRight className="relative z-10 h-4.5 w-4.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 sm:h-5 sm:w-5" />
              </motion.button>

              <button
                type="button"
                onClick={onSecondaryAction}
                className="inline-flex h-[3.1rem] items-center justify-center border border-white/12 px-7 supporthr-mono text-[12px] font-semibold uppercase tracking-[0.14em] text-zinc-100 transition-colors hover:border-white/24 hover:bg-white/[0.03] sm:h-[3.35rem] sm:px-9 sm:text-[13px]"
              >
                Xem workflow
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
