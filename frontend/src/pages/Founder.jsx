import React from "react";
import { Helmet } from "react-helmet-async";

const Founder = () => {
    const founderUrl = "https://aryusha.in/founder";

    const personSchema = {
        "@context": "https://schema.org",
        "@type": "Person",
        "@id": `${founderUrl}#founder`,
        name: "Aryan Raj",
        url: founderUrl,
        image: "https://aryusha.in/founder/aryan-raj.jpg",

        jobTitle: "Founder of Aryusha",

        description:
            "Aryan Raj is the Founder of Aryusha and an entrepreneur from Bihar. He completed his schooling in Bihar and graduated from Panipat Institute of Engineering & Technology. After working for around a year in the IT industry, he began his startup journey with Aryusha.",

        nationality: {
            "@type": "Country",
            name: "India",
        },

        alumniOf: {
            "@type": "CollegeOrUniversity",
            name: "Panipat Institute of Engineering & Technology",
            address: {
                "@type": "PostalAddress",
                addressLocality: "Panipat",
                addressRegion: "Haryana",
                addressCountry: "IN",
            },
        },

        worksFor: {
            "@type": "Organization",
            "@id": "https://aryusha.in/#organization",
            name: "Aryusha",
            url: "https://aryusha.in/",
        },

        sameAs: [
            "https://www.instagram.com/aryusha.in/",
            // Add your personal LinkedIn here
            // "https://www.linkedin.com/in/your-profile/",

            // Add your personal GitHub here
            // "https://github.com/your-profile",
        ],
    };

    return (
        <>
            <Helmet>
                {/* SEO */}
                <title>Aryan Raj — Founder of Aryusha</title>

                <meta
                    name="description"
                    content="Meet Aryan Raj, Founder of Aryusha. An entrepreneur from Bihar who graduated from Panipat Institute of Engineering & Technology and started his startup journey after working in the IT industry."
                />

                <meta
                    name="keywords"
                    content="Aryan Raj, Aryan Raj Founder, Founder of Aryusha, Aryusha Founder, Aryusha, Aryan Raj Bihar, Aryan Raj entrepreneur"
                />

                <link
                    rel="canonical"
                    href="https://aryusha.in/founder"
                />

                {/* Open Graph */}
                <meta
                    property="og:title"
                    content="Aryan Raj — Founder of Aryusha"
                />

                <meta
                    property="og:description"
                    content="Meet Aryan Raj, Founder of Aryusha and an entrepreneur from Bihar."
                />

                <meta
                    property="og:url"
                    content="https://aryusha.in/founder"
                />

                <meta
                    property="og:type"
                    content="profile"
                />

                <meta
                    property="og:image"
                    content="https://aryusha.in/founder/aryan-raj.jpg"
                />

                {/* Person Structured Data */}
                <script type="application/ld+json">
                    {JSON.stringify(personSchema)}
                </script>
            </Helmet>

            <main className="min-h-screen bg-white text-[#0B2214]">

                {/* ================= HERO ================= */}

                <section className="relative overflow-hidden bg-[#0B2214] text-white">

                    <div className="absolute -right-32 -top-32 h-80 w-80 rounded-full bg-white/5 blur-3xl" />

                    <div className="absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-white/5 blur-3xl" />

                    <div className="relative mx-auto flex max-w-6xl flex-col items-center gap-10 px-6 py-20 md:flex-row md:px-10 lg:py-28">

                        {/* Founder Image */}

                        <div className="flex w-full justify-center md:w-1/2">

                            <div className="relative">

                                <div className="absolute inset-0 scale-105 rounded-[32px] bg-white/10 blur-xl" />

                                <div className="relative h-[320px] w-[280px] overflow-hidden rounded-[32px] border border-white/20 bg-white/10 shadow-2xl md:h-[400px] md:w-[340px]">

                                    <img
                                        src="/founder/aryan-raj.jpg"
                                        alt="Aryan Raj - Founder of Aryusha"
                                        className="h-full w-full object-cover"
                                    />

                                </div>

                            </div>

                        </div>

                        {/* Hero Content */}

                        <div className="w-full md:w-1/2">

                            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-white/60">
                                Founder of Aryusha
                            </p>

                            <h1 className="text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
                                Aryan Raj
                            </h1>

                            <p className="mt-6 max-w-xl text-lg leading-8 text-white/75">
                                Entrepreneur from Bihar, technology professional and
                                Founder of Aryusha.
                            </p>

                            <p className="mt-4 max-w-xl text-base leading-7 text-white/60">
                                After completing his education and gaining experience
                                in the IT industry, Aryan started his entrepreneurial
                                journey with Aryusha.
                            </p>

                            <div className="mt-8 flex flex-wrap gap-3">

                                <a
                                    href="https://aryusha.in"
                                    className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#0B2214] transition hover:bg-white/90"
                                >
                                    Visit Aryusha
                                </a>

                                <a
                                    href="https://www.instagram.com/aryusha.in/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="rounded-full border border-white/25 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                                >
                                    Aryusha Instagram
                                </a>

                            </div>

                        </div>

                    </div>

                </section>

                {/* ================= ABOUT FOUNDER ================= */}

                <section className="mx-auto max-w-5xl px-6 py-20 md:px-10">

                    <div className="grid gap-12 md:grid-cols-5 md:items-start">

                        <div className="md:col-span-2">

                            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#0B2214]/50">
                                About the Founder
                            </p>

                            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
                                Meet Aryan Raj
                            </h2>

                            <p className="mt-4 text-sm font-medium text-[#0B2214]/60">
                                Founder of Aryusha
                            </p>

                        </div>

                        <div className="space-y-5 text-base leading-8 text-gray-600 md:col-span-3">

                            <p>
                                <strong className="text-[#0B2214]">
                                    Aryan Raj
                                </strong>{" "}
                                is the Founder of{" "}
                                <strong className="text-[#0B2214]">
                                    Aryusha
                                </strong>
                                , an entrepreneur from Bihar who started his
                                entrepreneurial journey with a vision to build
                                something of his own.
                            </p>

                            <p>
                                Aryan is from{" "}
                                <strong className="text-[#0B2214]">
                                    Bihar
                                </strong>
                                , where he completed his schooling. Growing up in
                                Bihar gave him an understanding of the everyday needs
                                of people and the challenges faced by local communities.
                            </p>

                            <p>
                                He completed his graduation from{" "}
                                <strong className="text-[#0B2214]">
                                    Panipat Institute of Engineering & Technology
                                </strong>
                                .
                            </p>

                            <p>
                                With a background in technology and computer science,
                                Aryan began his professional career in the IT industry.
                                He worked for around{" "}
                                <strong className="text-[#0B2214]">
                                    one year in an IT company
                                </strong>
                                , gaining practical experience in the technology and
                                professional environment.
                            </p>

                            <p>
                                After gaining professional experience, Aryan decided
                                to take the next step and begin his{" "}
                                <strong className="text-[#0B2214]">
                                    startup journey
                                </strong>
                                .
                            </p>

                            <p>
                                This journey led to the creation of{" "}
                                <strong className="text-[#0B2214]">
                                    Aryusha
                                </strong>
                                , a commerce platform built with the vision of making
                                everyday shopping simpler, convenient and accessible.
                            </p>

                            <p>
                                Today, Aryan is focused on building Aryusha, working
                                across product, technology, customer experience and
                                the overall vision of the company.
                            </p>

                        </div>

                    </div>

                </section>

                {/* ================= QUICK FACTS ================= */}

                <section className="bg-[#F5F7F5]">

                    <div className="mx-auto max-w-5xl px-6 py-20 md:px-10">

                        <div className="mb-10 text-center">

                            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#0B2214]/50">
                                Quick Facts
                            </p>

                            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
                                A little about Aryan
                            </h2>

                        </div>

                        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

                            {/* Age */}

                            <div className="rounded-2xl bg-white p-6 shadow-sm">

                                <p className="text-sm text-gray-500">
                                    Age
                                </p>

                                <p className="mt-2 text-xl font-bold text-[#0B2214]">
                                    25 Years
                                </p>

                            </div>

                            {/* From */}

                            <div className="rounded-2xl bg-white p-6 shadow-sm">

                                <p className="text-sm text-gray-500">
                                    From
                                </p>

                                <p className="mt-2 text-xl font-bold text-[#0B2214]">
                                    Bihar, India
                                </p>

                            </div>

                            {/* Education */}

                            <div className="rounded-2xl bg-white p-6 shadow-sm">

                                <p className="text-sm text-gray-500">
                                    Graduation
                                </p>

                                <p className="mt-2 text-lg font-bold text-[#0B2214]">
                                    PIET, Panipat
                                </p>

                            </div>

                            {/* Experience */}

                            <div className="rounded-2xl bg-white p-6 shadow-sm">

                                <p className="text-sm text-gray-500">
                                    Experience
                                </p>

                                <p className="mt-2 text-xl font-bold text-[#0B2214]">
                                    IT → Startup
                                </p>

                            </div>

                        </div>

                    </div>

                </section>

                {/* ================= EDUCATION & CAREER ================= */}

                <section className="mx-auto max-w-5xl px-6 py-20 md:px-10">

                    <div className="mb-12">

                        <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#0B2214]/50">
                            Journey
                        </p>

                        <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
                            From Bihar to building a startup
                        </h2>

                    </div>

                    <div className="space-y-8">

                        {/* Schooling */}

                        <div className="relative border-l-2 border-[#0B2214]/10 pl-7">

                            <div className="absolute -left-[7px] top-1 h-3 w-3 rounded-full bg-[#0B2214]" />

                            <p className="text-sm font-semibold uppercase tracking-wider text-gray-400">
                                Early Education
                            </p>

                            <h3 className="mt-2 text-xl font-bold">
                                Schooling in Bihar
                            </h3>

                            <p className="mt-2 leading-7 text-gray-600">
                                Aryan completed his schooling in Bihar, where he
                                developed the foundation for his academic and
                                professional journey.
                            </p>

                        </div>

                        {/* Graduation */}

                        <div className="relative border-l-2 border-[#0B2214]/10 pl-7">

                            <div className="absolute -left-[7px] top-1 h-3 w-3 rounded-full bg-[#0B2214]" />

                            <p className="text-sm font-semibold uppercase tracking-wider text-gray-400">
                                Higher Education
                            </p>

                            <h3 className="mt-2 text-xl font-bold">
                                Panipat Institute of Engineering & Technology
                            </h3>

                            <p className="mt-2 leading-7 text-gray-600">
                                Aryan completed his graduation from Panipat Institute
                                of Engineering & Technology, building his foundation
                                in technology and computer science.
                            </p>

                        </div>

                        {/* IT Career */}

                        <div className="relative border-l-2 border-[#0B2214]/10 pl-7">

                            <div className="absolute -left-[7px] top-1 h-3 w-3 rounded-full bg-[#0B2214]" />

                            <p className="text-sm font-semibold uppercase tracking-wider text-gray-400">
                                Professional Experience
                            </p>

                            <h3 className="mt-2 text-xl font-bold">
                                IT Industry
                            </h3>

                            <p className="mt-2 leading-7 text-gray-600">
                                After graduation, Aryan worked for around one year in
                                an IT company and gained professional experience in
                                the technology industry.
                            </p>

                        </div>

                        {/* Startup */}

                        <div className="relative border-l-2 border-[#0B2214]/10 pl-7">

                            <div className="absolute -left-[7px] top-1 h-3 w-3 rounded-full bg-[#0B2214]" />

                            <p className="text-sm font-semibold uppercase tracking-wider text-gray-400">
                                Entrepreneurship
                            </p>

                            <h3 className="mt-2 text-xl font-bold">
                                Founder of Aryusha
                            </h3>

                            <p className="mt-2 leading-7 text-gray-600">
                                After his experience in the IT industry, Aryan began
                                his startup journey and started building Aryusha with
                                a focus on solving real-world shopping and commerce
                                problems.
                            </p>

                        </div>

                    </div>

                </section>

                {/* ================= VISION ================= */}

                <section className="bg-[#F5F7F5]">

                    <div className="mx-auto max-w-5xl px-6 py-20 md:px-10">

                        <div className="rounded-[32px] bg-[#0B2214] p-8 text-white shadow-xl md:p-12">

                            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/50">
                                Vision
                            </p>

                            <blockquote className="mt-5 text-2xl font-semibold leading-relaxed md:text-4xl">
                                “Build something useful, keep it simple, and solve
                                real problems for real people.”
                            </blockquote>

                            <p className="mt-6 max-w-2xl leading-7 text-white/60">
                                Aryan's goal with Aryusha is to build a platform that
                                understands the needs of everyday customers and
                                delivers a simple and convenient shopping experience.
                            </p>

                        </div>

                    </div>

                </section>

                {/* ================= ABOUT ARYUSHA ================= */}

                <section className="mx-auto max-w-5xl px-6 py-20 md:px-10">

                    <div className="text-center">

                        <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#0B2214]/50">
                            About Aryusha
                        </p>

                        <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
                            Built for everyday shopping.
                        </h2>

                        <p className="mx-auto mt-5 max-w-2xl leading-8 text-gray-600">
                            Aryusha is a commerce platform created with the vision
                            of making everyday products more accessible through a
                            simple and convenient digital shopping experience.
                        </p>

                        <a
                            href="https://aryusha.in"
                            className="mt-8 inline-flex rounded-full bg-[#0B2214] px-7 py-3 font-semibold text-white transition hover:opacity-90"
                        >
                            Explore Aryusha
                        </a>

                    </div>

                </section>

                {/* ================= SOCIAL LINKS ================= */}

                <section className="border-t border-gray-100">

                    <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-5 px-6 py-10 sm:flex-row md:px-10">

                        <div>

                            <p className="font-semibold">
                                Aryan Raj
                            </p>

                            <p className="text-sm text-gray-500">
                                Founder of Aryusha
                            </p>

                        </div>

                        <div className="flex gap-5 text-sm font-medium">

                            <a
                                href="https://www.instagram.com/aryusha.in/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="transition hover:text-[#0B2214]"
                            >
                                Instagram
                            </a>

                            {/* Replace # with your personal LinkedIn */}

                            <a
                                href="https://www.linkedin.com/in/aryan-raj-861670212"
                                className="transition hover:text-[#0B2214]"
                            >
                                LinkedIn
                            </a>

                            {/* Replace # with your personal GitHub */}

                            <a
                                href="https://www.instagram.com/craanyone_"
                                className="transition hover:text-[#0B2214]"
                            >
                                Instagram
                            </a>

                            <a
                                href="#"
                                className="transition hover:text-[#0B2214]"
                            >
                                GitHub
                            </a>

                        </div>

                    </div>

                </section>

            </main>
        </>
    );
};

export default Founder;