import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface SwipeRowProps {
  children: React.ReactNode[];
  /** tailwind basis classes per item, e.g. "md:basis-1/2 lg:basis-1/3" */
  itemClassName?: string;
  ariaLabel?: string;
}

const SwipeRow = ({ children, itemClassName = "md:basis-1/2 lg:basis-1/3", ariaLabel }: SwipeRowProps) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    loop: true,
    dragFree: false,
  });
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  const [selected, setSelected] = useState(0);
  const [snaps, setSnaps] = useState<number[]>([]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanPrev(emblaApi.canScrollPrev());
    setCanNext(emblaApi.canScrollNext());
    setSelected(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    setSnaps(emblaApi.scrollSnapList());
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    const id = setInterval(() => emblaApi.scrollNext(), 5500);
    return () => {
      clearInterval(id);
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, onSelect]);

  return (
    <div className="relative" aria-label={ariaLabel}>
      <div className="overflow-hidden -mx-3" ref={emblaRef}>
        <div className="flex">
          {children.map((child, i) => (
            <div key={i} className={`min-w-0 shrink-0 grow-0 basis-full px-3 ${itemClassName}`}>
              <div className="h-full">{child}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between mt-8">
        <div className="flex items-center gap-2">
          {snaps.map((_, i) => (
            <button
              key={i}
              onClick={() => emblaApi?.scrollTo(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                i === selected ? "w-10 bg-accent" : "w-4 bg-border hover:bg-muted-foreground/40"
              }`}
            />
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => emblaApi?.scrollPrev()}
            disabled={!canPrev && !emblaApi?.scrollSnapList().length}
            aria-label="Previous"
            className="h-11 w-11 grid place-items-center rounded-full border border-border text-primary hover:bg-accent hover:text-accent-foreground hover:border-accent transition-spring"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => emblaApi?.scrollNext()}
            aria-label="Next"
            className="h-11 w-11 grid place-items-center rounded-full border border-border text-primary hover:bg-accent hover:text-accent-foreground hover:border-accent transition-spring"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SwipeRow;
