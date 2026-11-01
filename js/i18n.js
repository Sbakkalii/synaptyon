/* =========================================================
   SynaptYon SARL — i18n (FR / EN)
   Single source of truth for all translated strings.
   Exposes window.SynaptI18N = { t, apply, init, isFr }
   ========================================================= */
(function () {
    'use strict';

    const I18N = {
        fr: {
            title: 'SynaptYon SARL — Applied AI Hub',
            meta_desc: 'SynaptYon SARL — centre d\u2019excellence en IA appliquée : conseil stratégique, intégration et recherche pour des secteurs multiples.',
            nav_logo_al: 'SynaptYon — Accueil',
            nav_home: 'Accueil', nav_about: 'À propos', nav_services: 'Services',
            nav_team: 'Équipe',
            nav_process: 'Méthode', nav_contact: 'Contact',
            menu_open: 'Ouvrir le menu', menu_close: 'Fermer le menu',
            lang_al: 'Changer de langue', theme_al: 'Basculer le thème clair/sombre',
            back_to_top_al: 'Retour en haut de page',

            hero_eyebrow: '<span class="eyebrow-pulse" aria-hidden="true"></span>Applied AI Hub',
            hero_title: 'De la recherche à la production,<br><span class="gradient-text">chaque décision repose sur des résultats reproductibles.</span>',
            hero_sub: 'SynaptYon est un studio de recherche appliquée qui conçoit, développe et industrialise des solutions d\'IA — de la publication scientifique au déploiement en production.',
            hero_btn1: 'Diagnostic en 48h', hero_btn2: 'Découvrir notre méthode',
            stat1: 'Citations', stat2: 'Indice h', stat3: 'Publications',
            stat4: 'Co-auteurs', scroll_hint: 'Défiler',
            hero_logo_alt: 'Logo SynaptYon — emblème hexagonal en dégradé cyan, violet et magenta',

            marquee_al: 'Secteurs d\u2019expertise',
            m_supply_chain: 'Supply Chain', m_finance: 'Finance', m_retail: 'Retail',
            m_sante: 'Santé', m_education: 'Éducation', m_administration: 'Administration',
            m_agro: 'Agroalimentaire', m_logistique: 'Logistique',

            about_tag: 'Pourquoi SynaptYon',
            about_h2: 'Explorer. Bâtir. Conseiller. <span class="gradient-text">Trois pôles, une seule exigence.</span>',
            about_p: 'De la recherche fondamentale au déploiement en production, chaque décision repose sur des résultats publiés, validés et reproductibles.',
            about_c1_h3: 'Ancrage scientifique', about_c1_p: 'Nos solutions reposent sur des publications, des brevets et des partenariats académiques. Chaque modèle est validé, chaque résultat est reproductible.',
            about_c2_h3: 'Produits en production', about_c2_p: 'Nous ne livrons pas des POC qui dorment. Nos produits tournent en production, documentés, maintenus, sans vendor lock-in.',
            about_c3_h3: 'Vision internationale', about_c3_p: 'Opérant au Maroc, en France et à l\u2019international, nous maîtrisons les cadres réglementaires locaux et européens (RGPD, AI Act).',

            services_tag: 'Ce que nous faisons',
            services_h2: 'De la recherche au <span class="gradient-text">produit</span>, puis au <span class="gradient-text">conseil</span>',
            services_p: 'Trois pôles complémentaires pour couvrir toute la chaîne de valeur de l\u2019IA : explorer, bâtir, conseiller.',
            s1_h3: 'Recherche & Innovation', s1_p: 'R&D appliquée pour repousser les limites : prototypage, optimisation et valorisation de la propriété intellectuelle.',
            s1_f1: 'Prototypage & preuves de concept', s1_f2: 'Optimisation de processus', s1_f3: 'Brevets & licences', s1_f4: 'Partenariats académiques',
            s2_h3: 'Produits & Plateformes', s2_p: 'Des solutions IA et IT sur mesure, conçues, développées et mises en production pour un besoin précis.',
            s2_f1: 'Conception à la demande', s2_f2: 'Intégration à votre SI', s2_f3: 'SaaS, open-source & custom', s2_f4: 'Évolution & maintenance',
            s3_h3: 'Conseil IA & IT', s3_p: 'Un accompagnement stratégique pour identifier la valeur, prioriser et déployer l\u2019IA et l\u2019IT durablement.',
            s3_f1: 'Datastratégie & gouvernance', s3_f2: 'Feuilles de route IA', s3_f3: 'Cybersécurité',             s3_f4: 'Conduite du changement',
            learn_more: 'Découvrir',

            s1_deliverable: 'Vous repartez avec',
            s1_d1: 'Prototype validé sur données réelles',
            s1_d2: 'Propriété intellectuelle protégée',
            s1_d3: 'Partenariat académique en place',
            s2_deliverable: 'Vous repartez avec',
            s2_d1: 'Un produit en production, testé, surveillé',
            s2_d2: 'Documentation technique complète',
            s2_d3: 'Zéro vendor lock-in',
            s3_deliverable: 'Vous repartez avec',
            s3_d1: 'Une feuille de route IA chiffrée',
            s3_d2: 'Une gouvernance data en place',
            s3_d3: 'Des équipes formées et autonomes',

            process_tag: 'Notre méthode',
            process_h2: 'Un parcours <span class="gradient-text">structuré</span>, du diagnostic à la production',
            process_p: 'Une démarche agile et itérative, pensée pour réduire le risque et accélérer le value-time.',
            pr1_h3: 'Audit & cadrage', pr1_p: 'Cartographie de vos données, identification des cas d\u2019usage à fort ROI et définition de la feuille de route.', pr1_tag: 'Semaines 1–2',
            pr2_h3: 'Prototype & preuve', pr2_p: 'Développement d\u2019un PoC sur données réelles pour valider la faisabilité avant tout investissement lourd.', pr2_tag: 'Semaines 3–6',
            pr3_h3: 'Industrialisation', pr3_p: 'Architecture robuste, intégration à votre SI, pipelines de données et garde-fous qualité & conformité.', pr3_tag: 'Mois 2–4',
            pr4_h3: 'Suivi & scaling', pr4_p: 'Monitoring, itérations continues, formation des équipes et extension vers de nouveaux cas d\u2019usage.', pr4_tag: 'En continu',

            nom_tag: 'Le nom',
            nom_h2: 'SynaptYon, <span class="gradient-text">au-delà de la connexion.</span>',
            nom_synapse: 'La connexion neuronale. Le point où l\u2019information devient action.',
            nom_yon: 'Au-delà. Ce qui dépasse la connexion pour atteindre la décision.',
            nom_final: 'SynaptYon : de la donnée à la décision, au-delà de la connexion.',

            contact_tag: 'Parlons de votre projet',
            contact_h2: 'On commence par un échange. Sans engagement.',
            contact_p: 'Décrivez votre besoin, nous vous recontactons sous 24h ouvrées. Premier rendez-vous en 48h.',
            contact_email_label: 'Email', contact_company_label: 'Société',
            contact_name_ph: 'Votre nom complet', contact_email_ph: 'Votre email professionnel',
            contact_subject_ph: 'Sujet (ex : Appel d\u2019offres, SaaS, IA)',
            contact_message_ph: 'Décrivez votre besoin ou votre secteur d\u2019activité...',
            contact_submit: 'Envoyer le message',
            form_success: '✅ Votre message a été envoyé ! Nous vous recontacterons sous 24h. (Démo interactive)',
            form_error_required: '⚠️ Veuillez remplir les champs obligatoires (Nom, Email, Message).',
            form_error_email: '⚠️ Veuillez entrer une adresse email valide.',

            footer_tagline: 'Applied Intelligence, Amplified.',
            footer_al: 'Liens de pied de page', footer_legal: 'Mentions Légales', footer_privacy: 'Confidentialité',
            footer_tag: 'Applied Intelligence, Amplified.',

            cookie_text: 'Ce site utilise des cookies pour améliorer votre expérience. En continuant, vous acceptez notre politique de confidentialité.',
            cookie_accept: 'Accepter',
            cookie_learn: 'En savoir plus',

            team_tag: 'L\u2019équipe',
            team_h2: 'Deux parcours avant <span class="gradient-text">les algorithmes.</span>',
            team_p: 'Chaque client travaille directement avec les fondateurs. Pas de relais, pas de perte de contexte.',
            team_f1_name: '[Votre nom]',
            team_f1_role: 'Co-fondateur \u00b7 Direction recherche & technologie',
            team_f1_bio: 'Associate Professor à l\u2019IRISA, Université de Rennes. Spécialiste en vision par ordinateur, analyse de documents et reconnaissance de formes. 285 citations, indice h 9, publications dans Pattern Recognition, WACV, ICDAR.',
            team_f1_alt: 'Photo du fondateur',
            team_f2_name: '[Votre nom]',
            team_f2_role: 'Co-fondatrice \u00b7 Direction conseil & opérations',
            team_f2_bio: 'Experte en stratégie IA, gouvernance des données et conduite du changement. Accompagne les entreprises et administrations dans leur transformation digitale durable.',
            team_f2_alt: 'Photo de la fondatrice',

            reals_tag: 'Réalisations',
            reals_h2: 'Ce que <span class="gradient-text">nous avons construit.</span>',
            reals_p: 'Projets clients et R&D interne, du prototype au produit en production.',
            reals_r1_badge: 'Recherche',
            reals_r1_h3: 'Document AI pour extraction juridique',
            reals_r1_p: 'Pipeline de traitement de documents juridiques utilisant des modèles de langage fine-tunés pour l\u2019extraction et la classification automatique de clauses contractuelles.',
            reals_r2_badge: 'Produit',
            reals_r2_h3: 'Système de scoring intelligent',
            reals_r2_p: 'Plateforme de scoring automatisé pour l\u2019analyse de risques, intégrée au SI client avec dashboard temps réel et alertes configurables.',
            reals_r3_badge: 'Conseil',
            reals_r3_h3: 'Feuille de route IA pour secteur public',
            reals_r3_p: 'Audit de maturité data, identification de cas d\u2019usage prioritaires et construction d\u2019une roadmap IA chiffrée sur 18 mois pour une administration publique.',

            prods_tag: 'Produits',
            prods_h2: 'Nous les <span class="gradient-text">construisons.</span>',
            prods_p: 'Nos propres produits et plateformes, conçus et maintenus par SynaptYon.',
            prods_p1_status: 'EN DÉVELOPPEMENT',
            prods_p1_h3: 'DocuMind',
            prods_p1_p: 'Plateforme d\u2019analyse intelligente de documents. Extraction, classification et résumé automatique pour les équipes juridiques et financières.',
            prods_p2_status: 'BIENTÔT',
            prods_p2_h3: 'SynapseSearch',
            prods_p2_p: 'Moteur de recherche sémantique pour bases de connaissances internes. Comprend le contexte, pas seulement les mots-clés.',
            prods_p3_status: 'BIENTÔT',
            prods_p3_h3: 'AgentForge',
            prods_p3_p: 'Kit de création d\u2019agents IA spécialisés. Orchestration, mémoire et contrôle qualité intégrés, déployable en quelques heures.',

            research_tag: 'Recherche',
            research_h2: 'Nos <span class="gradient-text">publications.</span>',
            research_p: 'Chaque solution que nous déployons repose sur des résultats publiés et reproductibles.',
            research_all: 'Voir toutes les publications',
            res_r1_type: 'Preprint',
            res_r1_h3: '[Titre de la publication]',
            res_r1_p: '[Résumé en une phrase de la contribution scientifique.]',
            res_r1_link: 'Lire →',
            res_r2_type: 'Article',
            res_r2_h3: '[Titre de la publication]',
            res_r2_p: '[Résumé en une phrase de la contribution scientifique.]',
            res_r2_link: 'Lire →',
            res_r3_type: 'Open Source',
            res_r3_h3: '[Nom de l\u2019outil]',
            res_r3_p: '[Description de l\u2019outil open-source et de son utilité.]',
            res_r3_link: 'Voir sur GitHub →'
        },
        en: {
            title: 'SynaptYon SARL — Applied AI Hub',
            meta_desc: 'SynaptYon SARL — centre of excellence in applied AI: strategic consulting, integration and research for multiple sectors.',
            nav_logo_al: 'SynaptYon — Home',
            nav_home: 'Home', nav_about: 'About', nav_services: 'Services',
            nav_team: 'Team',
            nav_process: 'Method', nav_contact: 'Contact',
            menu_open: 'Open menu', menu_close: 'Close menu',
            lang_al: 'Change language', theme_al: 'Toggle light/dark theme',
            back_to_top_al: 'Back to top',

            hero_eyebrow: '<span class="eyebrow-pulse" aria-hidden="true"></span>Applied AI Hub',
            hero_title: 'From research to production,<br><span class="gradient-text">every decision rests on reproducible results.</span>',
            hero_sub: 'SynaptYon is an applied research studio that designs, develops and industrialises AI solutions — from scientific publication to production deployment.',
            hero_btn1: '48h diagnostic', hero_btn2: 'Explore our method',
            stat1: 'Citations', stat2: 'h-index', stat3: 'Publications',
            stat4: 'Co-authors', scroll_hint: 'Scroll',
            hero_logo_alt: 'SynaptYon logo — hexagonal emblem in cyan, violet and magenta gradient',

            marquee_al: 'Sectors of expertise',
            m_supply_chain: 'Supply Chain', m_finance: 'Finance', m_retail: 'Retail',
            m_sante: 'Healthcare', m_education: 'Education', m_administration: 'Public sector',
            m_agro: 'Agribusiness', m_logistique: 'Logistics',

            about_tag: 'Why SynaptYon',
            about_h2: 'Explore. Build. Advise. <span class="gradient-text">Three pillars, one standard.</span>',
            about_p: 'From fundamental research to production deployment, every decision rests on published, validated and reproducible results.',
            about_c1_h3: 'Scientific grounding', about_c1_p: 'Our solutions rest on publications, patents and academic partnerships. Every model is validated, every result is reproducible.',
            about_c2_h3: 'Products in production', about_c2_p: 'We don\u2019t deliver POCs that gather dust. Our products run in production, documented, maintained, with no vendor lock-in.',
            about_c3_h3: 'International reach', about_c3_p: 'Operating in Morocco, France and internationally, we master local and European regulatory frameworks (GDPR, AI Act).',

            services_tag: 'What we do',
            services_h2: 'From research to <span class="gradient-text">product</span>, then <span class="gradient-text">consulting</span>',
            services_p: 'Three complementary pillars covering the whole AI value chain: explore, build, advise.',
            s1_h3: 'Research & Innovation', s1_p: 'Applied R&D to push boundaries: prototyping, optimisation and IP valorisation.',
            s1_f1: 'Prototyping & proof of concept', s1_f2: 'Process optimisation', s1_f3: 'Patents & licences', s1_f4: 'Academic partnerships',
            s2_h3: 'Products & Platforms', s2_p: 'Bespoke AI and IT solutions, designed, developed and put into production for a specific need.',
            s2_f1: 'On-demand design', s2_f2: 'Integration with your IT systems', s2_f3: 'SaaS, open-source & custom', s2_f4: 'Evolution & maintenance',
            s3_h3: 'AI & IT Consulting', s3_p: 'Strategic support to identify value, prioritise and deploy AI and IT sustainably.',
            s3_f1: 'Data strategy & governance', s3_f2: 'AI roadmaps', s3_f3: 'Cybersecurity',             s3_f4: 'Change management',
            learn_more: 'Learn more',

            s1_deliverable: 'You leave with',
            s1_d1: 'Prototype validated on real data',
            s1_d2: 'Protected intellectual property',
            s1_d3: 'Academic partnership in place',
            s2_deliverable: 'You leave with',
            s2_d1: 'A product in production, tested, monitored',
            s2_d2: 'Complete technical documentation',
            s2_d3: 'Zero vendor lock-in',
            s3_deliverable: 'You leave with',
            s3_d1: 'A costed AI roadmap',
            s3_d2: 'Data governance in place',
            s3_d3: 'Trained, autonomous teams',

            process_tag: 'Our method',
            process_h2: 'A <span class="gradient-text">structured</span> journey, from diagnosis to production',
            process_p: 'An agile, iterative approach designed to reduce risk and accelerate time-to-value.',
            pr1_h3: 'Audit & scoping', pr1_p: 'Mapping your data, identifying high-ROI use cases and defining the roadmap.', pr1_tag: 'Weeks 1–2',
            pr2_h3: 'Prototype & proof', pr2_p: 'Building a PoC on real data to validate feasibility before heavy investment.', pr2_tag: 'Weeks 3–6',
            pr3_h3: 'Industrialisation', pr3_p: 'Robust architecture, integration with your IT, data pipelines and quality & compliance guardrails.', pr3_tag: 'Months 2–4',
            pr4_h3: 'Monitoring & scaling', pr4_p: 'Monitoring, continuous iteration, team training and extension to new use cases.', pr4_tag: 'Ongoing',

            nom_tag: 'The name',
            nom_h2: 'SynaptYon, <span class="gradient-text">beyond the connection.</span>',
            nom_synapse: 'The neural synapse. The point where information becomes action.',
            nom_yon: 'Beyond. What transcends the connection to reach the decision.',
            nom_final: 'SynaptYon: from data to decision, beyond the connection.',

            contact_tag: 'Let\u2019s talk about your project',
            contact_h2: 'It starts with a conversation. No commitment.',
            contact_p: 'Describe your need, we will get back to you within 24 business hours. First meeting within 48h.',
            contact_email_label: 'Email', contact_company_label: 'Company',
            contact_name_ph: 'Your full name', contact_email_ph: 'Your work email',
            contact_subject_ph: 'Subject (e.g. Tender, SaaS, AI)',
            contact_message_ph: 'Describe your need or your business sector...',
            contact_submit: 'Send message',
            form_success: '✅ Your message has been sent! We will get back to you within 24h. (Interactive demo)',
            form_error_required: '⚠️ Please fill in the required fields (Name, Email, Message).',
            form_error_email: '⚠️ Please enter a valid email address.',

            footer_tagline: 'Applied Intelligence, Amplified.',
            footer_al: 'Footer links', footer_legal: 'Legal notice', footer_privacy: 'Privacy',
            footer_tag: 'Applied Intelligence, Amplified.',

            cookie_text: 'This site uses cookies to improve your experience. By continuing, you accept our privacy policy.',
            cookie_accept: 'Accept',
            cookie_learn: 'Learn more',

            team_tag: 'The team',
            team_h2: 'Two careers before <span class="gradient-text">the algorithms.</span>',
            team_p: 'Every client works directly with the founders. No handoff, no loss of context.',
            team_f1_name: '[Your name]',
            team_f1_role: 'Co-founder \u00b7 Research & technology director',
            team_f1_bio: 'Associate Professor at IRISA, University of Rennes. Specialist in computer vision, document analysis and pattern recognition. 285 citations, h-index 9, publications in Pattern Recognition, WACV, ICDAR.',
            team_f1_alt: 'Founder photo',
            team_f2_name: '[Your name]',
            team_f2_role: 'Co-founder \u00b7 Consulting & operations director',
            team_f2_bio: 'Expert in AI strategy, data governance and change management. Helps businesses and public organisations achieve lasting digital transformation.',
            team_f2_alt: 'Co-founder photo',

            reals_tag: 'Work',
            reals_h2: 'What <span class="gradient-text">we have built.</span>',
            reals_p: 'Client projects and internal R&D, from prototype to production.',
            reals_r1_badge: 'Research',
            reals_r1_h3: 'Document AI for legal extraction',
            reals_r1_p: 'Legal document processing pipeline using fine-tuned language models for automatic extraction and classification of contractual clauses.',
            reals_r2_badge: 'Product',
            reals_r2_h3: 'Intelligent scoring system',
            reals_r2_p: 'Automated scoring platform for risk analysis, integrated into the client\u2019s IT system with real-time dashboard and configurable alerts.',
            reals_r3_badge: 'Consulting',
            reals_r3_h3: 'AI roadmap for public sector',
            reals_r3_p: 'Data maturity audit, priority use-case identification and construction of an 18-month AI roadmap for a public administration.',

            prods_tag: 'Products',
            prods_h2: 'We <span class="gradient-text">build them.</span>',
            prods_p: 'Our own products and platforms, designed and maintained by SynaptYon.',
            prods_p1_status: 'IN DEVELOPMENT',
            prods_p1_h3: 'DocuMind',
            prods_p1_p: 'Intelligent document analysis platform. Automatic extraction, classification and summarisation for legal and financial teams.',
            prods_p2_status: 'COMING SOON',
            prods_p2_h3: 'SynapseSearch',
            prods_p2_p: 'Semantic search engine for internal knowledge bases. Understands context, not just keywords.',
            prods_p3_status: 'COMING SOON',
            prods_p3_h3: 'AgentForge',
            prods_p3_p: 'Kit for building specialised AI agents. Orchestration, memory and quality control built in, deployable in hours.',

            research_tag: 'Research',
            research_h2: 'Our <span class="gradient-text">publications.</span>',
            research_p: 'Every solution we deploy rests on published, reproducible results.',
            research_all: 'View all publications',
            res_r1_type: 'Preprint',
            res_r1_h3: '[Publication title]',
            res_r1_p: '[One-sentence summary of the scientific contribution.]',
            res_r1_link: 'Read →',
            res_r2_type: 'Paper',
            res_r2_h3: '[Publication title]',
            res_r2_p: '[One-sentence summary of the scientific contribution.]',
            res_r2_link: 'Read →',
            res_r3_type: 'Open Source',
            res_r3_h3: '[Tool name]',
            res_r3_p: '[Description of the open-source tool and its purpose.]',
            res_r3_link: 'View on GitHub →'
        }
    };

    let lang = 'fr';

    const q = (s) => document.querySelector(s);

    function detectLang() {
        const saved = localStorage.getItem('lang');
        if (saved === 'fr' || saved === 'en') return saved;
        const nav = (navigator.languages && navigator.languages[0]) || navigator.language || '';
        return nav.toLowerCase().indexOf('fr') !== -1 ? 'fr' : 'en';
    }

    function t(key) {
        const dict = I18N[lang] || I18N.fr;
        return dict[key] != null ? dict[key] : (I18N.fr[key] != null ? I18N.fr[key] : '');
    }

    function updateHamburgerAria() {
        const hamburger = q('#hamburger');
        if (!hamburger) return;
        const isOpen = hamburger.getAttribute('aria-expanded') === 'true';
        hamburger.setAttribute('aria-label', t(isOpen ? 'menu_close' : 'menu_open'));
    }

    function apply(l) {
        lang = l === 'en' ? 'en' : 'fr';
        const dict = I18N[lang];
        document.documentElement.lang = lang;
        document.title = dict.title;
        const metaDesc = q('meta[name="description"]');
        if (metaDesc) metaDesc.setAttribute('content', dict.meta_desc);

        document.querySelectorAll('[data-i18n]').forEach(el => {
            const v = dict[el.dataset.i18n];
            if (v != null) el.innerHTML = v;
        });
        document.querySelectorAll('[data-i18n-ph]').forEach(el => {
            const v = dict[el.dataset.i18nPh];
            if (v != null) el.setAttribute('placeholder', v);
        });
        document.querySelectorAll('[data-i18n-al]').forEach(el => {
            const v = dict[el.dataset.i18nAl];
            if (v != null) el.setAttribute('aria-label', v);
        });
        document.querySelectorAll('[data-i18n-alt]').forEach(el => {
            const v = dict[el.dataset.i18nAlt];
            if (v != null) el.setAttribute('alt', v);
        });

        const toggleText = q('#langToggleText');
        if (toggleText) toggleText.textContent = lang === 'fr' ? 'EN' : 'FR';

        updateHamburgerAria();
    }

    function init() {
        apply(detectLang());
        const toggle = q('#langToggle');
        if (toggle) {
            toggle.addEventListener('click', () => {
                const next = lang === 'fr' ? 'en' : 'fr';
                localStorage.setItem('lang', next);
                apply(next);
            });
        }
    }

    window.SynaptI18N = { t, apply, init, isFr: () => lang === 'fr' };
})();
