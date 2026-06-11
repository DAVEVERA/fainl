import {
    ArrowRight,
    Search,
    ChevronUp,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Layers,
    Clock,
    Sparkles,
    X,
} from 'lucide-react';
import { FC, useState, useMemo, useEffect, useRef } from 'react';

const ITEMS_PER_PAGE = 12;
import { DIRECTIVES, Directive } from '../data/directives';
import { useLanguage } from '../contexts/LanguageContext';
import { SEO } from './SEO';

interface CookbookPageProps {
    onSelectMission: (query: string) => void;
}


export const CookbookPage: FC<CookbookPageProps> = ({ onSelectMission }) => {
    const { language } = useLanguage();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState<string>('All');
    const [sortBy, setSortBy] = useState<'popularity' | 'rating'>('popularity');
    const [currentPage, setCurrentPage] = useState(1);
    const categoryBarRef = useRef<HTMLDivElement>(null);

    const [localRatings, setLocalRatings] = useState<Record<string, number>>(() => {
        try { return JSON.parse(localStorage.getItem('fainl_votes') || '{}'); } catch { return {}; }
    });
    const [userVotes, setUserVotes] = useState<Record<string, 1 | -1>>(() => {
        try { return JSON.parse(localStorage.getItem('fainl_user_votes') || '{}'); } catch { return {}; }
    });

    const categoryCounts = DIRECTIVES.reduce<Record<string, number>>((acc, d) => {
        acc[d.category] = (acc[d.category] || 0) + 1;
        return acc;
    }, {});
    const categories = ['All', ...Array.from(new Set(DIRECTIVES.map(d => d.category))).filter(c => categoryCounts[c] >= 1)];

    const handleVote = (id: string, delta: 1 | -1, e: React.MouseEvent) => {
        e.stopPropagation();
        const existing = userVotes[id];
        const actualDelta = existing === delta ? -delta : (existing ? delta - existing : delta);
        const newUserVote = existing === delta ? undefined : delta;

        setLocalRatings(prev => {
            const next = { ...prev, [id]: (prev[id] || 0) + actualDelta };
            localStorage.setItem('fainl_votes', JSON.stringify(next));
            return next;
        });
        setUserVotes(prev => {
            const next = { ...prev };
            if (newUserVote === undefined) delete next[id];
            else next[id] = newUserVote;
            localStorage.setItem('fainl_user_votes', JSON.stringify(next));
            return next;
        });
    };

    const filteredDirectives = useMemo(() => {
        return DIRECTIVES.filter(d => {
            const matchesSearch = d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                d.query.toLowerCase().includes(searchQuery.toLowerCase()) ||
                d.subject.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = activeCategory === 'All' || d.category === activeCategory;
            return matchesSearch && matchesCategory;
        }).sort((a, b) => {
            if (sortBy === 'rating') {
                return ((b.rating + (localRatings[b.id] || 0)) - (a.rating + (localRatings[a.id] || 0)));
            }
            return b.popularity - a.popularity;
        });
    }, [searchQuery, activeCategory, sortBy, localRatings]);

    useEffect(() => { setCurrentPage(1); }, [searchQuery, activeCategory, sortBy]);

    const totalPages = Math.ceil(filteredDirectives.length / ITEMS_PER_PAGE);
    const pagedDirectives = filteredDirectives.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const goTo = (p: number) => {
        setCurrentPage(p);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <>
        <SEO
          title="Voorbeeldvragen voor AI Consensus — FAINL Kookboek"
          description="Ontdek honderden voorbeeldvragen voor meerdere AI-modellen tegelijk. Van juridisch advies tot marketingstrategie — laat AI consensus voor je werken."
          canonical="/cookbook"
          keywords="AI voorbeeldvragen, AI consensus voorbeelden, meerdere AI modellen gebruiken, FAINL kookboek"
        />

        <div className="max-w-6xl mx-auto px-4 md:px-6 py-10 md:py-16">

            {/* ── Hero ── */}
            <div className="mb-16 md:mb-24">
                <div className="inline-flex items-center gap-3 px-6 py-3 bg-[var(--color-accent)] text-black text-lg font-black uppercase tracking-widest rounded-none border-4 border-black mb-6 shadow-[6px_6px_0_0_black]">
                    <Sparkles className="w-5 h-5" />
                    {language === 'nl' ? 'Voorbeeldvragen' : 'Example Questions'}
                </div>
                <h1 className="text-5xl md:text-8xl font-black uppercase tracking-tighter text-black dark:text-white mb-8 leading-none">
                    {language === 'nl' ? 'Waar wil jij\nAI-consensus over?' : 'What do you want\nAI consensus on?'}
                </h1>
                <p className="text-xl md:text-3xl text-black dark:text-white/70 font-bold max-w-3xl leading-tight mb-12">
                    {language === 'nl'
                        ? 'Kies een vraag die je aanspreekt en laat meerdere AI-modellen er tegelijk naar kijken. Je ontvangt één gefundeerd consensus-antwoord.'
                        : 'Pick a question that interests you and let multiple AI models analyze it simultaneously. You receive one well-founded consensus answer.'}
                </p>

                {/* Step flow */}
                <div className="flex flex-col sm:flex-row gap-4 max-w-3xl">
                    {[
                        { n: '1', label: language === 'nl' ? 'Kies een vraag' : 'Pick a question' },
                        { n: '2', label: language === 'nl' ? 'Klik op Probeer dit' : 'Click Try this' },
                        { n: '3', label: language === 'nl' ? 'Ontvang consensus' : 'Receive consensus' },
                    ].map((step, i, arr) => (
                        <div key={step.n} className="flex items-center gap-4">
                            <div className="flex items-center gap-4 px-6 py-4 bg-black dark:bg-[var(--color-accent)] text-white dark:text-black rounded-none border-4 border-black shadow-[6px_6px_0_0_var(--color-accent)]">
                                <span className="text-xl font-black text-[var(--color-accent)] dark:text-black">{step.n}</span>
                                <span className="text-lg font-black uppercase tracking-widest whitespace-nowrap">{step.label}</span>
                            </div>
                            {i < arr.length - 1 && (
                                <ArrowRight className="w-6 h-6 text-black dark:text-white/20 mx-2 shrink-0" />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Search + Sort ── */}
            <div className="mb-10 flex flex-col sm:flex-row gap-6">
                <div className="relative flex-1">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-[var(--color-accent)]" />
                    <input
                        type="text"
                        placeholder={language === 'nl' ? 'Zoek een vraag of onderwerp…' : 'Search a question or topic…'}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white dark:bg-black border-4 border-black dark:border-[var(--color-accent)] rounded-none pl-16 pr-12 py-6 text-2xl font-black focus:outline-none focus:shadow-[10px_10px_0_0_var(--color-accent)] transition-all placeholder:text-black dark:placeholder:text-white/30 text-black dark:text-white uppercase"
                    />
                    {searchQuery && (
                        <button
                            type="button"
                            onClick={() => setSearchQuery('')}
                            title={language === 'nl' ? 'Zoekopdracht wissen' : 'Clear search'}
                            aria-label={language === 'nl' ? 'Zoekopdracht wissen' : 'Clear search'}
                            className="absolute right-6 top-1/2 -translate-y-1/2 p-2 text-black hover:text-black dark:text-white/30 dark:hover:text-[var(--color-accent)] transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    )}
                </div>
                <div className="relative">
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        title={language === 'nl' ? 'Sorteren op' : 'Sort by'}
                        aria-label={language === 'nl' ? 'Sorteren op' : 'Sort by'}
                        className="appearance-none bg-white dark:bg-black border-4 border-black dark:border-[var(--color-accent)] rounded-none px-8 py-6 pr-14 text-xl font-black uppercase tracking-widest focus:outline-none cursor-pointer text-black dark:text-white focus:shadow-[8px_8px_0_0_var(--color-accent)] transition-all"
                    >
                        <option value="popularity">{language === 'nl' ? 'Meest gebruikt' : 'Most used'}</option>
                        <option value="rating">{language === 'nl' ? 'Hoogst beoordeeld' : 'Top rated'}</option>
                    </select>
                    <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-6 h-6 pointer-events-none text-[var(--color-accent)]" />
                </div>
            </div>

            {/* ── Category pills ── */}
            <div
                ref={categoryBarRef}
                className="flex gap-4 overflow-x-auto pb-6 mb-12 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap"
            >
                {categories.map(cat => (
                    <button
                        key={cat}
                        type="button"
                        onClick={() => setActiveCategory(cat)}
                        className={`shrink-0 px-6 py-3 rounded-none text-lg font-black uppercase tracking-widest border-4 transition-all whitespace-nowrap shadow-[4px_4px_0_0_black] ${
                            activeCategory === cat
                                ? 'bg-[var(--color-accent)] text-black border-black shadow-none translate-x-1 translate-y-1'
                                : 'bg-white dark:bg-black text-black/60 dark:text-white/60 border-black dark:border-[var(--color-accent)]/40 hover:border-black dark:hover:border-[var(--color-accent)] hover:text-black dark:hover:text-white'
                        }`}
                    >
                        {cat === 'All' ? (language === 'nl' ? 'Alles' : 'All') : cat}
                        {cat !== 'All' && (
                            <span className="ml-2 opacity-50 text-base">{categoryCounts[cat]}</span>
                        )}
                    </button>
                ))}
            </div>

            {/* ── Results count ── */}
            <p className="text-lg font-black uppercase tracking-[0.4em] text-[var(--color-accent)] mb-8">
                {filteredDirectives.length} {language === 'nl' ? 'vragen' : 'questions'}
                {totalPages > 1 && ` · pagina ${currentPage} van ${totalPages}`}
            </p>

            {/* ── Grid ── */}
            {filteredDirectives.length === 0 ? (
                <div className="py-20 text-center border-2 border-dashed border-black/10 dark:border-white/10 rounded-2xl">
                    <Search className="w-8 h-8 mx-auto mb-3 text-black dark:text-white/20" />
                    <p className="font-black uppercase tracking-widest text-black dark:text-white/30 text-sm">
                        {language === 'nl' ? 'Geen vragen gevonden' : 'No questions found'}
                    </p>
                    <button
                        type="button"
                        onClick={() => { setSearchQuery(''); setActiveCategory('All'); }}
                        className="mt-4 text-sm font-black uppercase tracking-widest underline text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white transition-colors"
                    >
                        {language === 'nl' ? 'Filters wissen' : 'Clear filters'}
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
                    {pagedDirectives.map((directive) => (
                        <DirectiveCard
                            key={directive.id}
                            directive={directive}
                            localRating={localRatings[directive.id] || 0}
                            userVote={userVotes[directive.id]}
                            onVote={handleVote}
                            onSelect={() => onSelectMission(directive.query)}
                            language={language}
                        />
                    ))}
                </div>
            )}

            {/* ── Pagination ── */}
            {totalPages > 1 && (() => {
                const slots: (number | '…')[] = [];
                const add = (p: number) => { if (!slots.includes(p)) slots.push(p); };
                add(1);
                if (currentPage > 3) slots.push('…');
                for (let p = Math.max(2, currentPage - 1); p <= Math.min(totalPages - 1, currentPage + 1); p++) add(p);
                if (currentPage < totalPages - 2) slots.push('…');
                add(totalPages);

                return (
                    <div className="mt-10 flex flex-col items-center gap-4">
                        <p className="text-sm font-black uppercase tracking-widest text-black dark:text-white/30">
                            {language === 'nl' ? `Pagina ${currentPage} van ${totalPages}` : `Page ${currentPage} of ${totalPages}`}
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => goTo(currentPage - 1)}
                                disabled={currentPage === 1}
                                title={language === 'nl' ? 'Vorige pagina' : 'Previous page'}
                                aria-label={language === 'nl' ? 'Vorige pagina' : 'Previous page'}
                                className="w-9 h-9 flex items-center justify-center rounded-lg border-2 border-black/15 dark:border-white/15 font-black disabled:opacity-25 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black hover:border-black dark:hover:border-white transition-all"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            {slots.map((slot, i) =>
                                slot === '…' ? (
                                    <span key={`el-${i}`} className="w-9 h-9 flex items-center justify-center text-black dark:text-white/30 font-black text-sm">…</span>
                                ) : (
                                    <button
                                        key={slot}
                                        type="button"
                                        onClick={() => goTo(slot)}
                                        className={`w-9 h-9 flex items-center justify-center rounded-lg border-2 font-black text-sm transition-all ${
                                            slot === currentPage
                                                ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white scale-110 shadow-md'
                                                : 'border-black/15 dark:border-white/15 hover:border-black dark:hover:border-white hover:bg-black/5 dark:hover:bg-white/5'
                                        }`}
                                    >
                                        {slot}
                                    </button>
                                )
                            )}
                            <button
                                type="button"
                                onClick={() => goTo(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                title={language === 'nl' ? 'Volgende pagina' : 'Next page'}
                                aria-label={language === 'nl' ? 'Volgende pagina' : 'Next page'}
                                className="w-9 h-9 flex items-center justify-center rounded-lg border-2 border-black/15 dark:border-white/15 font-black disabled:opacity-25 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black hover:border-black dark:hover:border-white transition-all"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                );
            })()}

            {/* ── Bottom CTA ── */}
            <div className="mt-32 p-16 md:p-24 bg-[var(--color-accent)] text-black rounded-none border-8 border-black text-center relative overflow-hidden shadow-[20px_20px_0_0_black]">
                <div className="relative z-10 max-w-2xl mx-auto space-y-10">
                    <div className="inline-flex items-center gap-3 px-6 py-2 bg-black text-white text-lg font-black uppercase tracking-widest rounded-none">
                        <Sparkles className="w-5 h-5 text-[var(--color-accent)]" />
                        {language === 'nl' ? 'Eigen vraag?' : 'Your own question?'}
                    </div>
                    <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none">
                        {language === 'nl' ? 'Stel jouw eigen vraag' : 'Ask your own question'}
                    </h2>
                    <p className="text-black text-xl md:text-2xl font-bold leading-tight">
                        {language === 'nl'
                            ? 'Staat jouw vraag er niet bij? Ga naar de hoofdpagina en typ hem direct in. Elke vraag is welkom.'
                            : "Don't see your question? Go to the home page and type it in directly. Any question is welcome."}
                    </p>
                    <a
                        href="/mission"
                        className="inline-flex items-center gap-4 px-12 py-6 bg-black text-white font-black uppercase tracking-widest text-xl rounded-none hover:bg-white hover:text-black transition-all shadow-[10px_10px_0_0_white] border-4 border-black"
                    >
                        {language === 'nl' ? 'Begin hier' : 'Start here'} <ArrowRight className="w-6 h-6" />
                    </a>
                </div>
            </div>
        </div>
        </>
    );
};

/* ────────────────────────────────────────────────────────── */
interface DirectiveCardProps {
    directive: Directive;
    localRating: number;
    userVote?: 1 | -1;
    onVote: (id: string, delta: 1 | -1, e: React.MouseEvent) => void;
    onSelect: () => void;
    language: string;
}

const DirectiveCard: FC<DirectiveCardProps> = ({ directive, localRating, userVote, onVote, onSelect, language }) => {
    const rating = directive.rating + localRating;

    return (
        <div className="group flex flex-col bg-white dark:bg-black border-4 border-black dark:border-[var(--color-accent)] rounded-none overflow-hidden transition-all duration-300 hover:shadow-[12px_12px_0_0_var(--color-accent)] hover:-translate-x-1 hover:-translate-y-1">

            {/* Card header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 gap-4">
                <div className="flex items-center gap-3 min-w-0">
                    <span className="text-base font-black text-[var(--color-accent)] uppercase tracking-widest truncate">{directive.category}</span>
                </div>
                {/* Votes */}
                <div className="flex items-center gap-2 shrink-0">
                    <button
                        type="button"
                        onClick={(e) => onVote(directive.id, 1, e)}
                        aria-label="Upvote"
                        className={`p-1.5 border-2 border-black rounded-none transition-colors ${userVote === 1 ? 'bg-[var(--color-accent)] text-black' : 'bg-white text-black hover:bg-[var(--color-accent)]'}`}
                    >
                        <ChevronUp className="w-5 h-5" />
                    </button>
                    <span className="text-xl font-black text-black dark:text-white min-w-[30px] text-center">{rating}</span>
                    <button
                        type="button"
                        onClick={(e) => onVote(directive.id, -1, e)}
                        aria-label="Downvote"
                        className={`p-1.5 border-2 border-black rounded-none transition-colors ${userVote === -1 ? 'bg-red-500 text-white' : 'bg-white text-black hover:bg-red-500 hover:text-white'}`}
                    >
                        <ChevronDown className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Title + question */}
            <div className="px-6 pb-6 flex-1 flex flex-col gap-4">
                <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-black dark:text-white leading-tight line-clamp-2">
                    {directive.title}
                </h3>
                <blockquote className="border-l-8 border-[var(--color-accent)] pl-5 py-4 bg-zinc-50 dark:bg-zinc-900 rounded-none">
                    <p className="text-lg md:text-xl text-black dark:text-white/70 leading-relaxed font-bold italic line-clamp-3">
                        "{directive.query}"
                    </p>
                </blockquote>
            </div>

            {/* Footer */}
            <div className="border-t-4 border-black flex items-center justify-between px-6 py-5 bg-zinc-50 dark:bg-zinc-900">
                <div className="flex items-center gap-4 text-sm font-black text-black/40 dark:text-white/40 uppercase tracking-widest">
                    <span className="flex items-center gap-1.5">
                        <Layers className="w-4 h-4" /> {directive.nodesNeeded} nodes
                    </span>
                    <span className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4" /> {directive.length}
                    </span>
                </div>
                <button
                    type="button"
                    onClick={onSelect}
                    className="flex items-center gap-2 px-6 py-3 bg-black text-white font-black text-lg uppercase tracking-widest rounded-none hover:bg-[var(--color-accent)] hover:text-black transition-all shadow-[6px_6px_0_0_var(--color-accent)] border-2 border-black"
                >
                    {language === 'nl' ? 'Probeer dit' : 'Try this'} <ArrowRight className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};
