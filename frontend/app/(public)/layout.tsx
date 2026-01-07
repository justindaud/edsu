
/* eslint-disable react-hooks/exhaustive-deps */
'use client'

import { useRef, useState } from 'react'
import { UsersRound } from '@/components/animate-ui/icons/users-round'
import { Brush } from '@/components/animate-ui/icons/brush'
import { ClipboardList } from '@/components/animate-ui/icons/clipboard-list'
import { Book } from '@/components/animate-ui/icons/book'
import { Home } from '@/components/animate-ui/icons/home'
import { Article } from '@/components/animate-ui/icons/article'
import { FaInstagram, FaWhatsapp, FaEnvelope } from 'react-icons/fa'
import { FloatingNav } from '@/components/ui/floating-navbar'

const placeholderImg = '/logo.gif'
const TBYTLogo2Black = '/logo/tbyt opt 2 cream.png'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const [forceShowNav, setForceShowNav] = useState(false)
  const navRef = useRef<HTMLDivElement | null>(null)

  const navItems = [
    {
      name: "Hom3",
      link: "/",
      icon: <Home animate animation='path-loop' loop={true} className="h-4 w-4" />,
    },
    {
      name: "Program5",
      link: "/programs",
      icon: <ClipboardList animate animation='default' loop={true} className="h-4 w-4" />,
    },
    {
      name: "Artwork5",
      link: "/artworks",
      icon: <Brush animate animation='default' loop={true} className="h-4 w-4" />,
    },
    {
      name: "Arti5t5",
      link: "/artists",
      icon: <UsersRound animate animation='default' loop={true} className="h-4 w-4" />,
    },
    {
      name: "Article5",
      link: "/articles",
      icon: (
        <Article animate animation='default' loop={true} className="h-4 w-4" />
      ),
    },
    {
      name: "ToKo8uKu",
      link: "/tokobuku",
      icon: <Book animate animation='default' loop={true} className="h-4 w-4" />
    },
  ];

  return (
    <main id="top" className="min-h-screen bg-[var(--edsu-white)] text-[var(--edsu-white)]">
      {/* Topbar */}
      <header className="relative z-10 top-0 bg-[var(--edsu-green)] h-10">
        <div className="mx-auto flex w-full items-center justify-between px-4">
          <div className="h-10 w-10" />
          <button
            className="relative h-10 w-20"
            aria-label="Toggle menu"
            onClick={() => {
              setForceShowNav((v) => !v)
              if (navRef.current) {
                navRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
              }
            }}
          >
            <img
              src={placeholderImg}
              alt="EDSU"
              className="absolute inset-0 h-full w-full object-contain"
            />
          </button>
          <div className="h-10 w-10" />
        </div>
      </header>

      <div className="relative w-full" ref={navRef}>
        <FloatingNav navItems={navItems} forceShow={forceShowNav} />
      </div>

      {children}

      <div className="mx-auto px-4 bg-[var(--edsu-pink)] text-[var(--edsu-white)] justify-end">
        <a
          href="#top"
          className="inline-flex text-xs uppercase tracking-[0.16em]"
        >
          Back to top
        </a>
      </div>

      {/* Footer */}
      <footer className="bg-[var(--edsu-pink)] text-[var(--card-foreground)]">
        <div className="mx-auto w-full px-4 pt-4 grid gap-4">
            <div className="grid grid-cols-2 items-center">
                <div className="relative h-8 w-14">
                    <img
                        src={placeholderImg}
                        alt="EDSU"
                        className="absolute inset-0 h-full w-full object-contain"
                    />
                </div>
                <div className="relative h-8 w-14 justify-self-end">
                    <img
                        src={TBYTLogo2Black}
                        alt="TokoBuKu YangTau"
                        className="absolute inset-0 h-full w-full object-contain"
                    />
                </div>
            </div>
            <div className="grid grid-cols-2 items-center">
              <div className="flex gap-4">    
                <a
                    href="https://wa.me/6281818257272"
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Edsu House WhatsApp"
                >
                    <FaWhatsapp className="h-4 w-4 text-[var(--edsu-green)] hover:text-[var(--black)]" />
                </a>
                <a aria-label="EDSU House Instagram"
                    href="https://www.instagram.com/edsu_house/"
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Edsu House Instagram"
                >
                    <FaInstagram className="h-4 w-4 text-[var(--edsu-green)] hover:text-[var(--black)]" />
                </a>
                <a
                    href="mailto:hello@edsu-house.com"
                    className="social-icon-link"
                    title="Edsu House Email"
                    rel="noopener noreferrer"
                >
                    <FaEnvelope className="h-4 w-4 text-[var(--edsu-green)] hover:text-[var(--black)]" />
                </a>
              </div>
              <div className="flex gap-4 justify-end"> 
                <a aria-label="TokoBuku YangTau Instagram"
                    href="https://www.instagram.com/tokobukuyangtau/"
                    target="_blank"
                    rel="noopener noreferrer"
                    title="TokoBuku YangTau Instagram"
                >
                    <FaInstagram className="h-4 w-4 text-[var(--edsu-cream)] hover:text-[var(--black)]" />
                </a>
                <a
                    href="mailto:tokobukuyangtau@edsu-house.com"
                    className="social-icon-link"
                    title="TokoBuku YangTau Email"
                    rel="noopener noreferrer"
                >
                    <FaEnvelope className="h-4 w-4 text-[var(--edsu-cream)] hover:text-[var(--black)]" />
                </a>
              </div>
            </div>
        </div>
        <div className="relative w-full overflow-hidden rounded-lg h-[240px] md:h-[320px] p-4">
            <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d988.4647811447902!2d110.38087232243927!3d-7.758182399999999!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e7a592c3b456be3%3A0x78e9499afb829d42!2sEDSU%20house!5e0!3m2!1sen!2sid!4v1711460429818!5m2!1sen!2sid"
                className="w-full h-full border-0 transition-opacity duration-300"
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
            />
        </div>
      </footer>
    </main>
  )
}
