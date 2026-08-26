"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { youtubeEmbedUrl, type Hero, type Lang } from "@/content";
import { IconChevronLeft, IconChevronRight } from "@/components/icons";

const AUTOPLAY_MS = 6000;
const SWIPE_THRESHOLD_PX = 50;

/**
 * Slider do fundo do hero da homepage (FR-1, design-spec-fase3 secção 1).
 * O texto do hero (tag/título/motto/botões) NÃO faz parte deste componente
 * — fica sempre fixo por cima, renderizado pelo `HomeContent` (design-spec 1.1).
 *
 * Consome exclusivamente `visibleHeroSlides` (já filtrado em content/index.ts,
 * handoff-34 secção D.5) — nunca filtra `visible` por si próprio.
 */
export function HeroSlider({
  slider,
  slides,
  lang,
}: {
  slider: Hero["slider"];
  slides: Hero["slider"]["slides"];
  lang: Lang;
}) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const total = slides.length;
  const hasMultiple = total > 1;
  const activeSlide = slides[current];

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mql.matches);
    const onChange = () => setReducedMotion(mql.matches);
    mql.addEventListener?.("change", onChange);
    return () => mql.removeEventListener?.("change", onChange);
  }, []);

  const goTo = useCallback(
    (index: number) => {
      setCurrent(((index % total) + total) % total);
    },
    [total]
  );
  const next = useCallback(() => goTo(current + 1), [current, goTo]);
  const prev = useCallback(() => goTo(current - 1), [current, goTo]);

  // Autoplay: só avança quando o slide activo é imagem, sem pausa (hover/
  // foco) e sem prefers-reduced-motion (design-spec-fase3 1.4).
  useEffect(() => {
    if (!hasMultiple) return;
    if (reducedMotion) return;
    if (paused) return;
    if (activeSlide?.type !== "image") return;
    const timer = setTimeout(next, AUTOPLAY_MS);
    return () => clearTimeout(timer);
  }, [hasMultiple, reducedMotion, paused, activeSlide, next]);

  function onTouchStart(event: React.TouchEvent) {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  }
  function onTouchEnd(event: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const endX = event.changedTouches[0]?.clientX ?? touchStartX.current;
    const delta = endX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < SWIPE_THRESHOLD_PX) return;
    if (delta < 0) next();
    else prev();
  }

  return (
    <div
      ref={rootRef}
      className="hero-slider"
      role="region"
      aria-roledescription="carousel"
      aria-label={slider.label[lang]}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(event) => {
        if (!rootRef.current?.contains(event.relatedTarget as Node)) setPaused(false);
      }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {slides.map((slide, index) => {
        const isActive = index === current;
        if (slide.type === "image") {
          return (
            <div key={index} className={`hero-slide${isActive ? " hero-slide--active" : ""}`} aria-hidden={!isActive}>
              <Image
                src={slide.image}
                alt={slide.alt[lang]}
                fill
                priority={index === 0}
                loading={index === 0 ? undefined : "lazy"}
                className="hero-slide-media"
              />
            </div>
          );
        }
        return (
          <div key={index} className={`hero-slide${isActive ? " hero-slide--active" : ""}`} aria-hidden={!isActive}>
            <iframe
              src={youtubeEmbedUrl(slide.youtubeId)}
              title={slide.caption[lang]}
              aria-label={slide.caption[lang]}
              className="hero-slide-media"
              allow="autoplay; encrypted-media; picture-in-picture"
              loading={index === 0 ? "eager" : "lazy"}
              tabIndex={isActive ? 0 : -1}
            />
          </div>
        );
      })}

      {hasMultiple && (
        <>
          <button
            type="button"
            className="hero-slider-arrow hero-slider-arrow--prev"
            aria-label={slider.previousLabel[lang]}
            onClick={prev}
          >
            <IconChevronLeft />
          </button>
          <button
            type="button"
            className="hero-slider-arrow hero-slider-arrow--next"
            aria-label={slider.nextLabel[lang]}
            onClick={next}
          >
            <IconChevronRight />
          </button>
          <div className="hero-slider-dots">
            {slides.map((_, index) => (
              <button
                key={index}
                type="button"
                className={`hero-slider-dot${index === current ? " hero-slider-dot--active" : ""}`}
                aria-label={slider.goToSlideLabel[lang].replace("{n}", String(index + 1))}
                aria-current={index === current}
                onClick={() => goTo(index)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
