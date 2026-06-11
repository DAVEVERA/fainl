import { FC } from 'react';
import { Cookie } from 'lucide-react';
import { SEO } from './SEO';

export const CookieDeclarationPage: FC = () => {
  return (
    <>
    <SEO
      title="Cookieverklaring — FAINL"
      description="Welke cookies FAINL gebruikt en hoe je ze beheert. Versie 13-03-2026."
      canonical="/cookies"
      keywords="FAINL cookies, cookieverklaring, cookiebeleid FAINL"
    />
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-12 md:py-24 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="bg-white dark:bg-black border-4 border-black dark:border-[#03B390] p-10 md:p-20 shadow-[15px_15px_0_0_black] dark:shadow-[15px_15px_0_0_#03B390] rounded-none">

        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center gap-8 mb-16 pb-12 border-b-4 border-black/10 dark:border-[#03B390]/20">
          <div className="w-20 h-20 bg-black dark:bg-[#03B390] rounded-none flex items-center justify-center shrink-0">
            <Cookie className="text-white dark:text-black w-10 h-10" />
          </div>
          <div>
            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-black dark:text-white leading-tight mb-4">Cookieverklaring</h1>
            <p className="text-lg font-black text-[#03B390] dark:text-[#03B390] uppercase tracking-widest">FAINL — MNRV · Versie 13-03-2026</p>
          </div>
        </div>

        {/* Body */}
        <div className="prose prose-xl max-w-none dark:prose-invert prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tight prose-h2:text-3xl prose-h2:mt-16 prose-h2:mb-6 prose-p:text-black/80 dark:prose-p:text-white/80 prose-li:text-black/80 dark:prose-li:text-white/80 prose-strong:text-black dark:prose-strong:text-[#03B390]">

          <p>FAINL gebruikt functionele, analytische en, indien van toepassing, marketingcookies.</p>

          <h2>Functionele cookies</h2>
          <p>Deze zijn noodzakelijk voor het correct functioneren van de website en applicatie, waaronder sessiebeheer, beveiliging, inloggen en voorkeuren. Voor deze cookies is geen toestemming vereist.</p>

          <h2>Analytische cookies</h2>
          <p>Deze helpen FAINL om gebruik, prestaties, fouten en gebruikerservaring te analyseren en de Dienst te verbeteren. Waar wettelijk vereist wordt hiervoor toestemming gevraagd.</p>

          <h2>Marketingcookies</h2>
          <p>Alleen indien FAINL marketing- of remarketingtools inzet en voor zover wettelijk vereist uitsluitend na voorafgaande toestemming. Zonder toestemming worden geen marketingcookies geplaatst.</p>

          <h2>Cookiebeheer</h2>
          <p>Gebruikers kunnen hun voorkeuren aanpassen via de cookiebanner of browserinstellingen. Het uitschakelen van bepaalde cookies kan de werking van de website beïnvloeden.</p>

          <h2>Derde partijen</h2>
          <p>Indien derde partijen cookies plaatsen, vermeldt FAINL deze in het cookieoverzicht met naam, doel, bewaartermijn en aanbieder. FAINL kan dit overzicht bijwerken wanneer nieuwe derde partijen worden ingezet.</p>

          <h2>Contact</h2>
          <p>Voor vragen over cookies: <a href="mailto:info@mnrv.nl">info@mnrv.nl</a></p>

        </div>
      </div>
    </div>
    </>
  );
};
