import type { AnchorHTMLAttributes, MouseEvent } from "react";

type LinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
};

export function Link({ href, onClick, target, ...props }: LinkProps) {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);

    if (
      event.defaultPrevented ||
      target ||
      event.button !== 0 ||
      event.metaKey ||
      event.altKey ||
      event.ctrlKey ||
      event.shiftKey
    ) {
      return;
    }

    event.preventDefault();
    window.history.pushState(null, "", href);
    window.dispatchEvent(new Event("app:navigate"));
  }

  return <a href={href} onClick={handleClick} target={target} {...props} />;
}
