import { useLanguage } from "../contexts/LanguageContext";
import chrome1 from "../assets/chrome_1.png";
import chrome2 from "../assets/chrome_2.png";

export function Install() {
  const { t } = useLanguage();

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold text-brand-dark mb-2">
          {t("install_title")}
        </h1>
        <p className="text-brand-text-muted max-w-2xl">
          {t("install_description")}
        </p>
      </div>

      <section
        className="border-t border-brand-border pt-8"
        aria-labelledby="install-chrome-heading"
      >
        <h2
          id="install-chrome-heading"
          className="text-xl font-semibold text-brand-dark mb-2"
        >
          {t("install_chrome_heading")}
        </h2>
        <p className="text-brand-text-muted text-base mb-6 max-w-2xl">
          {t("install_chrome_intro")}
        </p>

        <ol className="list-decimal list-inside space-y-6 text-brand-text text-base max-w-2xl marker:text-brand-text-muted">
          <li>
            <span className="text-brand-text">{t("install_chrome_step1")}</span>
            <figure className="mt-3 not-prose">
              <img
                src={chrome1}
                alt={t("install_chrome_figure1")}
                className="w-full max-w-md rounded-xl border border-brand-border shadow-sm"
                loading="lazy"
              />
            </figure>
          </li>
          <li>
            <span className="text-brand-text">{t("install_chrome_step2")}</span>
          </li>
          <li>
            <span className="text-brand-text">{t("install_chrome_step3")}</span>
            <figure className="mt-3 not-prose">
              <img
                src={chrome2}
                alt={t("install_chrome_figure2")}
                className="w-full max-w-md rounded-xl border border-brand-border shadow-sm"
                loading="lazy"
              />
            </figure>
          </li>
        </ol>
      </section>
    </div>
  );
}
