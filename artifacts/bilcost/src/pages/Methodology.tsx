import { t } from "@/lib/i18n";

export function MethodologyPage() {
  return (
    <article className="max-w-3xl mx-auto px-6 py-12 prose prose-stone">
      <h1 className="font-display text-3xl font-semibold text-ink-800">
        {t("methodology.heading")}
      </h1>
      <p className="text-ink-500">{t("methodology.lede")}</p>

      <Section title="1. Værditab (depreciation)">
        Vi bruger en aldersbaseret eksponentiel kurve: 20% i år 0, 15% i år 1,
        12% i år 2–3, 10% i år 4–6, 8% i år 7–10, derefter 6% pr. år. Oven i
        det lægger vi et kilometertillæg (op til 25%) hvis bilen kører mere
        end 15.000 km/år gennemsnitligt. Kilden er en forenkling af
        FDM/DAT-Veritas' tabeller for det danske brugtmarked.
      </Section>

      <Section title="2. Renter på lån">
        Standard annuitetslån. Vi antager månedlig terminsbetaling og at en
        eventuel restgæld ved salg dækkes 1:1 af salgssummen. Default-renten
        på 7,0% ÅOP svarer til typiske danske billån i bank.
      </Section>

      <Section title="3. Forsikring">
        Estimat: en basispræmie afhængig af bilens pris (4.500 kr/år for biler
        under 75.000 kr op til 19.000 kr/år for biler over 800.000 kr) ganget
        med en aldersfaktor (1,8 for under 25, 1,0 for 30–49, 0,95 for 50–64)
        og en regionsfaktor (Storkøbenhavn 1,15; Aarhus 1,10; resten af
        landet 1,00). Modellen er bygget på offentligt tilgængelige takster fra
        Tryg, Topdanmark og If. Du kan altid overstyre med din egen præmie.
      </Section>

      <Section title="4. Service og reparationer">
        Basisbeløb stiger med bilens alder: 3.500 kr/år (0–3 år), 6.000 kr/år
        (4–7 år), 9.000 kr/år (8–12 år), 12.000 kr/år derefter. Plus 0,18 kr/km
        i sliddele. Elbiler får 40% rabat fordi de hverken har motorolie eller
        traditionelt bremsesystem.
      </Section>

      <Section title="5. Brændstof og strøm">
        Forbrænding: <code>årlig kørsel ÷ km/l × kr/l</code>.<br />
        El: <code>årlig kørsel × kWh/100 km ÷ 100 × kr/kWh</code>.<br />
        Plug-in hybrid: 60% el / 40% benzin som forenkling. Vi antager
        hjemmeladning til standard residentialpris — DC hurtigladning er
        dyrere og indgår ikke i v1.
      </Section>

      <Section title="6. Grøn ejerafgift">
        Modellen bruger Skats halvårlige satser baseret på forbrug (km/l) for
        biler fra 1997 og frem. Diesel får et udligningstillæg.
        Elbiler betaler en reduceret afgift under indfasningen frem mod 2035.
        Tallene er forenklede til ca. 12 trin — slå op på{" "}
        <a href="https://www.skat.dk" target="_blank" rel="noopener noreferrer">
          skat.dk
        </a>{" "}
        for det eksakte beløb for din bil.
      </Section>

      <Section title="7. Dæk og sliddele">
        Et fuldt sæt sommer + vinterdæk holder ca. 40.000 km. Pris pr. sæt
        spænder fra 4.500 kr (smårum) til 12.000 kr (premium SUV) afhængig af
        bilens kørselsklarvægt. Plus 1.200 kr/år til viskere, sprinklervæske
        og småting.
      </Section>

      <Section title="8. Syn">
        Dansk synsplan: første syn ved 4 år, derefter hvert 2. år. Vi regner
        700 kr pr. gang inkl. eventuelt omsyn — typisk takst hos FDM og Applus.
      </Section>

      <Section title={t("methodology.datasource.title")}>
        {t("methodology.datasource.body")}
      </Section>

      <Section title={t("methodology.notyet.title")}>
        <ul>
          <li>Vægtafgift for ældre biler fra før 1997</li>
          <li>Vejhjælp / abonnementer</li>
          <li>Værditab på vinterdæk specifikt</li>
          <li>Skattefordele ved firmabil eller leasing</li>
          <li>Hurtigladning i marken (kun home-charging for EVer)</li>
        </ul>
      </Section>
    </article>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8">
      <h2 className="font-display text-xl font-semibold text-ink-800">
        {title}
      </h2>
      <div className="text-ink-600 mt-2 leading-relaxed">{children}</div>
    </section>
  );
}
