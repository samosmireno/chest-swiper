import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  LabelList,
} from "recharts";
import { useGame } from "../../context/GameContext";
import type { CumulativeStats, PatientProfile } from "../../types";

interface CommunityInsightsProps {
  stats: CumulativeStats;
}

interface ChartRow {
  label: string;
  missRate: number;
}

function formatAgeSex(ageSex: string): string {
  const match = ageSex.match(/^(\d+)-year-old\s+(\w+)/);
  if (!match) return ageSex;
  return `${match[1]} yo\n${match[2]}`;
}

function getMostMissed(stats: CumulativeStats, allProfiles: PatientProfile[], topN = 5): ChartRow[] {
  return Object.entries(stats.perCard)
    .filter(([, { timesShown }]) => timesShown > 0)
    .map(([id, { timesShown, timesCorrect }]) => {
      const profile = allProfiles.find((p) => p.id === id);
      return {
        label: profile ? formatAgeSex(profile.ageSex) : id,
        missRate: Math.round(((timesShown - timesCorrect) / timesShown) * 100),
      };
    })
    .sort((a, b) => b.missRate - a.missRate)
    .slice(0, topN);
}

const BAR_CONFIGS = [
  { main: "#e82020", light: "#ff8080", dark: "#880808", glow: "#ff1010" },
  { main: "#e86010", light: "#ffaa60", dark: "#883000", glow: "#ff6010" },
  { main: "#d4b800", light: "#fff080", dark: "#806000", glow: "#ffd800" },
  { main: "#2870e8", light: "#80b8ff", dark: "#0c3088", glow: "#2060ff" },
  { main: "#18c050", light: "#80ffaa", dark: "#086028", glow: "#10e850" },
];

const BAR_COLORS = BAR_CONFIGS.map((c) => c.main);

function CustomXAxisTick({
  x,
  y,
  payload,
}: {
  x?: number;
  y?: number;
  payload?: { value: string };
}) {
  const words = String(payload?.value ?? "").split("\n");
  return (
    <g transform={`translate(${x},${y})`}>
      <text textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize={11}>
        {words.map((word, i) => (
          <tspan key={i} x={0} dy={i === 0 ? 10 : 12}>
            {word}
          </tspan>
        ))}
      </text>
    </g>
  );
}

function GlowBar(props: {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  index?: number;
}) {
  const { x = 0, y = 0, width = 0, height = 0, index = 0 } = props;
  const cfg = BAR_CONFIGS[index % BAR_CONFIGS.length];
  const r = 5;
  const gradId = `ci-grad-${index}`;
  const topPath = `M${x},${y + height} L${x},${y + r} Q${x},${y} ${x + r},${y} L${x + width - r},${y} Q${x + width},${y} ${x + width},${y + r} L${x + width},${y + height} Z`;

  return (
    <g>
      {/* Gradient definition — placed per bar, browsers handle duplicate defs fine */}
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="white" stopOpacity="0.9" />
          <stop offset="8%" stopColor={cfg.light} stopOpacity="1" />
          <stop offset="35%" stopColor={cfg.main} stopOpacity="1" />
          <stop offset="75%" stopColor={cfg.dark} stopOpacity="1" />
          <stop offset="100%" stopColor={cfg.dark} stopOpacity="0.6" />
        </linearGradient>
      </defs>

      {/* Outer bloom glow */}
      <rect
        x={x - 6}
        y={y - 6}
        width={width + 12}
        height={height + 6}
        rx={10}
        fill={cfg.glow}
        opacity={0.25}
        className="blur-[7px]"
      />

      {/* Inner tighter glow */}
      <rect
        x={x - 2}
        y={y - 2}
        width={width + 4}
        height={height + 2}
        rx={6}
        fill={cfg.glow}
        opacity={0.3}
        className="blur-[3px]"
      />

      {/* Main 3D bar body */}
      <path d={topPath} fill={`url(#${gradId})`} />

      {/* Glass reflection stripe — left edge */}
      <rect
        x={x + 5}
        y={y + 8}
        width={3}
        height={Math.max(0, height - 20)}
        rx={1.5}
        fill="white"
        opacity={0.5}
      />

      {/* Soft inner centre highlight */}
      <rect
        x={x + width * 0.2}
        y={y + 6}
        width={width * 0.3}
        height={Math.max(0, height - 18)}
        rx={2}
        fill="white"
        opacity={0.1}
        className="blur-[3px]"
      />
    </g>
  );
}

export function CommunityInsights({ stats }: CommunityInsightsProps) {
  const { profiles } = useGame();
  const data = getMostMissed(stats, profiles);

  return (
    <div className="flex min-h-64 flex-1 flex-col overflow-hidden p-3">
      <p className="font-display font-extrabold tracking-[0.2em] text-white text-center text-lg leading-tight uppercase">
        Community Insights
      </p>

      {data.length === 0 ? (
        <p className="mt-3 text-sm text-white italic">
          Data will appear after the first completed session.
        </p>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="horizontal"
            margin={{ top: 16, right: 8, bottom: 24, left: 8 }}
          >
            <XAxis
              type="category"
              dataKey="label"
              tick={<CustomXAxisTick />}
              axisLine={false}
              tickLine={false}
              interval={0}
            />
            <YAxis hide />
            <Tooltip
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(value: any) => [`${value}% missed`, ""]}
              contentStyle={{
                fontSize: 11,
                background: "rgba(10,4,30,0.9)",
                border: "1px solid rgba(155,48,255,0.4)",
                color: "white",
              }}
            />
            <Bar dataKey="missRate" shape={<GlowBar />}>
              <LabelList
                dataKey="missRate"
                position="top"
                formatter={(v) => `${v}%`}
                style={{
                  fontSize: 13,
                  fill: "white",
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}

      <p className="font-display font-bold tracking-[0.15em] text-center text-sm uppercase text-white/50">
        Most Missed Profiles
      </p>
    </div>
  );
}

export { BAR_COLORS };
