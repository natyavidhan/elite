interface Props {
  values: number[];
  width?: number;
  height?: number;
}

export function SparkLine({ values, width = 90, height = 28 }: Props) {
  if (values.length < 2) {
    return <div style={{ width, height }} className="flex items-center text-[10px] text-ink-500 font-data">—</div>;
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const step = width / (values.length - 1);
  const points = values.map((v, i) => `${i * step},${height - ((v - min) / range) * (height - 4) - 2}`).join(' ');
  const last = values[values.length - 1];
  const lastX = (values.length - 1) * step;
  const lastY = height - ((last - min) / range) * (height - 4) - 2;

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline points={points} fill="none" stroke="#B8860B" strokeWidth={1.25} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lastX} cy={lastY} r={2} fill="#B8860B" />
    </svg>
  );
}
