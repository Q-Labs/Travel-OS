export function CatPip({ color, size, title }: { color?: string; size?: number; title?: string }) {
  const style = size === undefined ? { background: color } : { background: color, width: size, height: size };
  return <span className="cat-pip" style={style} title={title} />;
}
