import { Link, useLocation } from "wouter";
import { t } from "@/lib/i18n";

export function Header() {
  const [loc] = useLocation();
  return (
    <header className="border-b border-ink-100 bg-paper">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-md bg-ink-800 grid place-items-center text-paper font-display font-semibold">
            B
          </div>
          <div>
            <div className="font-display text-xl font-semibold leading-none">
              Bilcost
            </div>
            <div className="text-[11px] text-ink-400 leading-none mt-1 uppercase tracking-wider">
              {t("header.tagline")}
            </div>
          </div>
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          <Link
            href="/"
            className={
              loc === "/"
                ? "text-ink-800 font-medium"
                : "text-ink-500 hover:text-ink-800"
            }
          >
            {t("header.nav.compare")}
          </Link>
          <Link
            href="/saadan-regner-vi"
            className={
              loc === "/saadan-regner-vi"
                ? "text-ink-800 font-medium"
                : "text-ink-500 hover:text-ink-800"
            }
          >
            {t("header.nav.methodology")}
          </Link>
        </nav>
      </div>
    </header>
  );
}
