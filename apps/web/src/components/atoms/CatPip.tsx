/** A small coloured dot for a trip category. `size` overrides the size from the stylesheet and `title` is the hover text. */
export function CatPip({ color, size, title }: { color?: string; size?: number; title?: string }) {
  const style = size === undefined ? { background: color } : { background: color, width: size, height: size };
  return <span className="cat-pip" style={style} title={title} />;
}
