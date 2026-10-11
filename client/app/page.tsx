import Link from "next/link";
import { Hanken_Grotesk, Newsreader } from "next/font/google";
import {
  Copy,
  FileText,
  FileUp,
  Languages,
  MessagesSquare,
  Moon,
  Quote,
  Scale,
  ShieldCheck,
  Sigma,
  Timer,
} from "lucide-react";

import { Button } from "@/components/ui/button";

const display = Newsreader({
  subsets: ["latin"],
  variable: "--font-display",
});

const body = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-body",
});

export const metadata = {
  title: "DocMind: ask your documents, know which answers to trust",
  description:
    "Upload documents, ask questions in Arabic, French or English, and check every claim against the page it came from.",
};

const features = [
  {
    icon: MessagesSquare,
    title: "A chat for every project",
    text: "Each chat keeps its own documents and history, separate from your other work.",
  },
  {
    icon: FileUp,
    title: "Upload and track processing",
    text: "Add your files and watch each one move from pending to ready.",
  },
  {
    icon: Languages,
    title: "Arabic, French and English",
    text: "Ask in one language, find answers in documents written in another.",
    extra: (
      <span dir="rtl" lang="ar" className="mt-1 block text-foreground/80">
        كم مدة الإشعار؟
      </span>
    ),
  },
  {
    icon: Quote,
    title: "Sources on every answer",
    text: "See the file, the page and the similarity score behind each reply.",
  },
  {
    icon: ShieldCheck,
    title: "Claim-by-claim checking",
    text: "Each statement is marked supported, weak, unverified or contradicted.",
  },
  {
    icon: Scale,
    title: "Conflict detection",
    text: "When two documents disagree, DocMind tells you instead of picking one.",
  },
  {
    icon: Sigma,
    title: "Readable answers",
    text: "Bold text, lists and math formulas render properly. Copy any answer in one click.",
  },
  {
    icon: Timer,
    title: "Model and speed shown",
    text: "Every reply shows which model answered and how long it took.",
  },
  {
    icon: Moon,
    title: "Light and dark mode",
    text: "Follows your system setting, or switch whenever you like.",
  },
];

function Verdict({
  tone,
  label,
}: {
  tone: "ok" | "weak" | "bad";
  label: string;
}) {
  const styles = {
    ok: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300",
    weak: "bg-amber-500/15 text-amber-800 dark:text-amber-300",
    bad: "bg-rose-500/15 text-rose-800 dark:text-rose-300",
  } as const;

  const dots = {
    ok: "bg-emerald-500",
    weak: "bg-amber-500",
    bad: "bg-rose-500",
  } as const;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${styles[tone]}`}
    >
      <span className={`size-1.5 rounded-full ${dots[tone]}`} />
      {label}
    </span>
  );
}

export default function LandingPage() {
  return (
    <section
      className={`${display.variable} ${body.variable} relative min-h-screen overflow-hidden bg-background font-[family-name:var(--font-body)] text-foreground`}
    >
      <style>{`
        .claim {
          --c: #10b981;
          color: inherit;
          padding: 0 2px;
          border-radius: 3px;
          box-decoration-break: clone;
          -webkit-box-decoration-break: clone;
          background-image:
            linear-gradient(var(--c), var(--c)),
            linear-gradient(
              color-mix(in oklab, var(--c) 16%, transparent),
              color-mix(in oklab, var(--c) 16%, transparent)
            );
          background-repeat: no-repeat;
          background-position: 0 100%, 0 0;
          background-size: 0% 2px, 100% 100%;
          animation: claim-draw 0.8s ease-out forwards;
          animation-delay: var(--d, 0.5s);
        }
        .claim-weak { --c: #f59e0b; }
        .claim-bad { --c: #f43f5e; }
        @keyframes claim-draw {
          to { background-size: 100% 2px, 100% 100%; }
        }
        @media (prefers-reduced-motion: reduce) {
          .claim {
            animation: none;
            background-size: 100% 2px, 100% 100%;
          }
        }
      `}</style>

      {/* Quiet dotted paper texture */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 [background-image:radial-gradient(color-mix(in_oklab,var(--foreground)_14%,transparent)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:radial-gradient(ellipse_at_65%_35%,black,transparent_72%)]"
      />

      <div className="relative mx-auto w-full max-w-6xl px-6 py-10 lg:py-14">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <FileText className="size-5" />
          </span>
          <span className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight">
            DocMind
          </span>
        </div>

        {/* Hero */}
        <div className="mt-14 grid items-center gap-14 lg:mt-20 lg:grid-cols-[5fr_6fr]">
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-5xl font-medium leading-[1.05] tracking-tight sm:text-6xl">
              Ask your documents. Know which answers to trust.
            </h1>

            <p className="mt-6 max-w-md text-lg leading-relaxed text-muted-foreground">
              Upload your files, ask in Arabic, French or English, and check
              every claim against the page it came from.
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <Button asChild size="lg" className="h-12 px-7 text-base">
                <Link href="/register">Create account</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 px-7 text-base"
              >
                <Link href="/login">Log in</Link>
              </Button>
            </div>
          </div>

          {/* Product preview: the verified answer */}
          <div
            aria-label="Example of a verified answer"
            className="rounded-3xl border bg-card/80 p-4 shadow-xl backdrop-blur sm:p-6"
          >
            <div className="ml-auto w-fit max-w-[85%] rounded-2xl bg-primary px-4 py-3 text-sm text-primary-foreground">
              How long is the notice period if I cancel early?
            </div>

            <div className="mt-4 rounded-2xl border bg-background p-4 sm:p-5">
              <p className="text-[15px] leading-8">
                <span className="claim">
                  The contract requires 30 days&rsquo; written notice before
                  cancelling.
                </span>{" "}
                <span className="claim claim-weak" style={{ "--d": "1.2s" } as React.CSSProperties}>
                  Early cancellation may carry a fee of 2% of the remaining
                  value.
                </span>{" "}
                <span className="claim claim-bad" style={{ "--d": "1.9s" } as React.CSSProperties}>
                  Written confirmation is not required.
                </span>
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <Verdict tone="ok" label="Supported 94%" />
                <Verdict tone="weak" label="Weak 52%" />
                <Verdict tone="bad" label="Contradicted 88%" />
              </div>

              <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
                <Scale className="mt-0.5 size-4 shrink-0 text-amber-700 dark:text-amber-300" />
                <p>
                  <span className="font-medium">Your documents disagree.</span>{" "}
                  contract.pdf says 30 days on page 4, annex.pdf says 60 days
                  on page 2.
                </p>
              </div>

              <div className="mt-4 rounded-xl border bg-muted/40 p-3">
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="truncate font-medium">contract.pdf</span>
                  <span className="shrink-0 text-muted-foreground">
                    Page 4, score 0.82
                  </span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  &hellip; the Client may terminate this agreement by giving{" "}
                  <span className="rounded bg-amber-300/60 px-0.5 text-foreground dark:bg-amber-400/25">
                    thirty (30) days&rsquo; written notice
                  </span>{" "}
                  to the Provider, after which all outstanding amounts become
                  due &hellip;
                </p>
              </div>

              <div className="mt-4 flex items-center gap-2 text-xs">
                <span className="rounded-full border border-emerald-700/40 bg-emerald-500/15 px-2 py-0.5 text-emerald-900 dark:text-emerald-200">
                  gemini-2.5-flash
                </span>
                <span className="rounded-full border border-blue-700/40 bg-blue-500/15 px-2 py-0.5 text-blue-900 dark:text-blue-200">
                  1,240 ms
                </span>
                <span className="ml-auto inline-flex items-center gap-1 text-muted-foreground">
                  <Copy className="size-3.5" />
                  Copy
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Everything it does */}
        <ul className="mt-16 grid gap-x-10 gap-y-8 border-t pt-10 sm:grid-cols-2 lg:mt-20 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, text, extra }) => (
            <li key={title} className="flex gap-3.5">
              <Icon className="mt-0.5 size-5 shrink-0 text-primary" />
              <div>
                <h2 className="font-semibold">{title}</h2>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {text}
                  {extra}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}