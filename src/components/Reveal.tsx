import { useEffect, useRef, type ReactNode, type HTMLAttributes } from "react";

type Props = HTMLAttributes<HTMLDivElement> & {
  as?: "div" | "section" | "span" | "li";
  children: ReactNode;
};

export function Reveal({ as = "div", children, className = "", ...rest }: Props) {
  const ref = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const Tag = as as any;
  return (
    <Tag ref={ref as any} className={`reveal ${className}`} {...rest}>
      {children}
    </Tag>
  );
}
