import { t } from "@/lib/i18n";

export function Footer() {
  return (
    <footer className="border-t border-ink-100 bg-paper-soft mt-16">
      <div className="max-w-7xl mx-auto px-6 py-8 text-xs text-ink-500 space-y-2">
        <p className="font-medium text-ink-600">{t("footer.disclaimer.head")}</p>
        <p>
          {t("footer.disclaimer.body.before")}{" "}
          <a
            href="https://www.skat.dk"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-ink-800"
          >
            skat.dk
          </a>
          .
        </p>
        <p className="text-ink-400">© {new Date().getFullYear()} Bilcost</p>
      </div>
    </footer>
  );
}
