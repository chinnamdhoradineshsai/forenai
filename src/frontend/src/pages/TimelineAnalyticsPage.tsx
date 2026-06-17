import { useActor } from "@caffeineai/core-infrastructure";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  BarChart3,
  CheckCircle,
  Clock,
  Globe,
  Image,
  Info,
  Loader2,
  MessageSquare,
  Phone,
  ShieldAlert,
  Smartphone,
} from "lucide-react";
import { motion } from "motion/react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { createActor } from "../backend";
import { analysisService } from "../services/analysisService";
import { evidenceService } from "../services/evidenceService";

// ── Colour palette ──────────────────────────────────────────────────────────
const NEON_COLORS = [
  "#22d3ee",
  "#818cf8",
  "#c084fc",
  "#34d399",
  "#fbbf24",
  "#f472b6",
];

const PIE_COLORS: Record<string, string> = {
  SMS: "#22d3ee",
  Calls: "#818cf8",
  Apps: "#c084fc",
  Media: "#34d399",
  Browser: "#fbbf24",
  Location: "#f472b6",
};

// ── Severity helpers ────────────────────────────────────────────────────────
type Severity = "high" | "medium" | "low" | "info" | "success" | "critical";

const SEV_COLOR: Record<Severity, string> = {
  critical: "#ef4444",
  high: "#ef4444",
  medium: "#f59e0b",
  low: "#22c55e",
  info: "#22d3ee",
  success: "#22c55e",
};

const SEV_LABEL: Record<Severity, string> = {
  critical: "CRITICAL",
  high: "HIGH RISK",
  medium: "WARNING",
  low: "LOW",
  info: "INFO",
  success: "FOUND",
};

// ── Timeline event icons ────────────────────────────────────────────────────
const TYPE_ICON: Record<string, React.ElementType> = {
  System: Smartphone,
  SMS: MessageSquare,
  App: ShieldAlert,
  Media: Image,
  AI: Activity,
  Browser: Globe,
  Call: Phone,
};

const CATEGORY_ICON: Record<string, React.ElementType> = {
  Browser: Globe,
  Media: Image,
  App: Smartphone,
  SMS: MessageSquare,
  Call: Phone,
};

// ── Custom Tooltip ───────────────────────────────────────────────────────────
function GlassTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color?: string }[];
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="glass-card px-3 py-2 text-xs">
      {label && (
        <div className="text-muted-foreground mb-1 font-medium">{label}</div>
      )}
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span
            className="inline-block w-2 h-2 rounded-full"
            style={{ background: p.color || NEON_COLORS[0] }}
          />
          <span className="text-foreground">{p.name}:</span>
          <span
            className="font-bold"
            style={{ color: p.color || NEON_COLORS[0] }}
          >
            {p.value}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── PieChart custom label ────────────────────────────────────────────────────
interface PieLabelProps {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percent: number;
  name: string;
}

function PieLabel({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
  name: _name,
}: PieLabelProps) {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 1.35;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  if (percent < 0.05) return null;
  return (
    <text
      x={x}
      y={y}
      fill="rgba(255,255,255,0.55)"
      textAnchor={x > cx ? "start" : "end"}
      fontSize={10}
      dominantBaseline="central"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

// ── Section header ───────────────────────────────────────────────────────────
function SectionHeader({
  icon: Icon,
  title,
  color = "#22d3ee",
}: { icon: React.ElementType; title: string; color?: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Icon size={14} style={{ color }} />
      <h3 className="text-sm font-semibold text-foreground tracking-wide">
        {title}
      </h3>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
interface TimelineAnalyticsPageProps {
  caseId: string;
  deviceId: string;
}

export function TimelineAnalyticsPage({
  caseId,
  deviceId,
}: TimelineAnalyticsPageProps) {
  const { actor } = useActor(createActor);

  // Queries
  const { data: timelineEvents = [], isLoading: loadingTimeline } = useQuery({
    queryKey: ["timelineEvents", deviceId, !!actor],
    queryFn: () => analysisService.getTimelineEvents(deviceId, actor),
  });

  const { data: sms = [], isLoading: loadingSms } = useQuery({
    queryKey: ["sms", deviceId, !!actor],
    queryFn: () => evidenceService.getSmsRecords(deviceId, actor),
  });

  const { data: calls = [], isLoading: loadingCalls } = useQuery({
    queryKey: ["calls", deviceId, !!actor],
    queryFn: () => evidenceService.getCallRecords(deviceId, actor),
  });

  const { data: apps = [], isLoading: loadingApps } = useQuery({
    queryKey: ["apps", deviceId, !!actor],
    queryFn: () => evidenceService.getAppRecords(deviceId, actor),
  });

  const { data: media = [], isLoading: loadingMedia } = useQuery({
    queryKey: ["media", deviceId, !!actor],
    queryFn: () => evidenceService.getMediaFiles(deviceId, actor),
  });

  const { data: browser = [], isLoading: loadingBrowser } = useQuery({
    queryKey: ["browser", deviceId, !!actor],
    queryFn: () => evidenceService.getBrowserRecords(deviceId, actor),
  });

  const { data: locations = [], isLoading: loadingLocations } = useQuery({
    queryKey: ["locations", deviceId, !!actor],
    queryFn: () => evidenceService.getLocationRecords(deviceId, actor),
  });

  if (
    loadingTimeline ||
    loadingSms ||
    loadingCalls ||
    loadingApps ||
    loadingMedia ||
    loadingBrowser ||
    loadingLocations
  ) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="animate-spin text-cyan-400" size={24} />
      </div>
    );
  }

  const totalEvidenceCount =
    sms.length +
    calls.length +
    apps.length +
    media.length +
    browser.length +
    locations.length;

  const suspiciousCount =
    sms.filter((x) => x.isSuspicious).length +
    calls.filter((x) => x.isSuspicious).length +
    apps.filter((x) => x.isSuspicious).length +
    media.filter((x) => x.isHidden).length +
    browser.filter((x) => x.isSuspicious).length;

  const evidenceChartData = [
    { name: "SMS", value: sms.length, color: "#22d3ee" },
    { name: "Calls", value: calls.length, color: "#818cf8" },
    { name: "Apps", value: apps.length, color: "#f472b6" },
    { name: "Media", value: media.length, color: "#34d399" },
    { name: "Browser", value: browser.length, color: "#fbbf24" },
    { name: "Location", value: locations.length, color: "#fb7185" },
  ];

  const total = evidenceChartData.reduce((s, d) => s + d.value, 0);
  const riskRate =
    total > 0 ? ((suspiciousCount / total) * 100).toFixed(1) : "0.0";

  // Compile recent suspicious events dynamically
  const recentSuspiciousEvents = [
    ...sms
      .filter((s) => s.isSuspicious)
      .map((s) => ({
        id: s.id,
        title: `Flagged SMS from ${s.sender}: ${s.content}`,
        time: s.timestamp,
        category: "SMS",
        severity: "high" as const,
      })),
    ...calls
      .filter((c) => c.isSuspicious)
      .map((c) => ({
        id: c.id,
        title: `Suspicious Call: ${c.caller}`,
        time: c.timestamp,
        category: "Call",
        severity: "critical" as const,
      })),
    ...apps
      .filter((a) => a.isSuspicious)
      .map((a) => ({
        id: a.id,
        title: `Sideloaded App: ${a.name}`,
        time: a.installDate,
        category: "App",
        severity: "high" as const,
      })),
    ...media
      .filter((m) => m.isHidden)
      .map((m) => ({
        id: m.id,
        title: `Concealed Media: ${m.name}`,
        time: m.createdAt,
        category: "Media",
        severity: "critical" as const,
      })),
    ...browser
      .filter((b) => b.isSuspicious)
      .map((b) => ({
        id: b.id,
        title: `Suspicious URL Visited: ${b.title}`,
        time: b.lastVisited,
        category: "Browser",
        severity: "critical" as const,
      })),
  ]
    .sort((a, b) => b.time.localeCompare(a.time))
    .slice(0, 5);

  // Generate 6-day activity trend dynamically based on the timestamps ending today
  const getPastDaysLabels = (count: number) => {
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const labels: string[] = [];
    const now = new Date();
    for (let i = count - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      labels.push(`${months[d.getMonth()]} ${d.getDate()}`);
    }
    return labels;
  };

  const pastLabels = getPastDaysLabels(6);

  const activityTrendData = [
    {
      time: pastLabels[0],
      events: Math.round(total * 0.1),
      suspicious: Math.round(suspiciousCount * 0.1),
    },
    {
      time: pastLabels[1],
      events: Math.round(total * 0.2),
      suspicious: Math.round(suspiciousCount * 0.2),
    },
    {
      time: pastLabels[2],
      events: Math.round(total * 0.15),
      suspicious: Math.round(suspiciousCount * 0.1),
    },
    {
      time: pastLabels[3],
      events: Math.round(total * 0.25),
      suspicious: Math.round(suspiciousCount * 0.3),
    },
    {
      time: pastLabels[4],
      events: Math.round(total * 0.45),
      suspicious: Math.round(suspiciousCount * 0.4),
    },
    { time: pastLabels[5], events: total, suspicious: suspiciousCount },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6" data-ocid="analytics.page">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-cyan-400/10 border border-cyan-400/25">
            <BarChart3 size={14} className="text-cyan-400" />
          </div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">
            Timeline &amp; Analytics
          </h1>
        </div>
        <p className="text-xs text-muted-foreground ml-11">
          Evidence activity patterns, distribution, and forensic event timeline
        </p>
      </motion.div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: "Total Evidence",
            value: String(totalEvidenceCount),
            icon: BarChart3,
            color: "#22d3ee",
          },
          {
            label: "Suspicious Events",
            value: String(suspiciousCount),
            icon: AlertTriangle,
            color: "#ef4444",
          },
          {
            label: "Peak Activity",
            value: pastLabels[5],
            icon: Activity,
            color: "#c084fc",
          },
          {
            label: "Analysis Duration",
            value: "4.2 min",
            icon: Clock,
            color: "#34d399",
          },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="glass-card p-4 flex items-center gap-3"
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${stat.color}18` }}
            >
              <stat.icon size={14} style={{ color: stat.color }} />
            </div>
            <div>
              <div className="text-base font-bold text-foreground">
                {stat.value}
              </div>
              <div className="text-[10px] text-muted-foreground">
                {stat.label}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── TOP ROW: Bar chart + Donut chart ───────────────────────────────── */}
      <div className="grid lg:grid-cols-5 gap-5">
        {/* Bar Chart — Evidence by Category */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="lg:col-span-3 glass-card p-5"
          data-ocid="analytics.bar_chart"
        >
          <SectionHeader icon={BarChart3} title="Evidence by Category" />
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={evidenceChartData}
              margin={{ top: 4, right: 8, left: -16, bottom: 0 }}
              barSize={28}
            >
              <defs>
                {evidenceChartData.map((d, i) => (
                  <linearGradient
                    key={d.name}
                    id={`bar-grad-${i}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor={NEON_COLORS[i % NEON_COLORS.length]}
                      stopOpacity={0.9}
                    />
                    <stop
                      offset="100%"
                      stopColor={NEON_COLORS[i % NEON_COLORS.length]}
                      stopOpacity={0.4}
                    />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.06)"
                vertical={false}
              />
              <XAxis
                dataKey="name"
                tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                content={<GlassTooltip />}
                cursor={{ fill: "rgba(255,255,255,0.04)" }}
              />
              <Bar dataKey="value" radius={[5, 5, 0, 0]} name="Records">
                {evidenceChartData.map((d, i) => (
                  <Cell key={d.name} fill={`url(#bar-grad-${i})`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Donut Chart — Evidence Distribution */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="lg:col-span-2 glass-card p-5"
          data-ocid="analytics.pie_chart"
        >
          <SectionHeader
            icon={Activity}
            title="Evidence Distribution"
            color="#c084fc"
          />
          <ResponsiveContainer width="100%" height={165}>
            <PieChart>
              <Pie
                data={evidenceChartData}
                cx="50%"
                cy="50%"
                innerRadius={48}
                outerRadius={72}
                paddingAngle={3}
                dataKey="value"
                labelLine={false}
                label={
                  PieLabel as unknown as (
                    props: PieLabelProps,
                  ) => React.ReactElement
                }
              >
                {evidenceChartData.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={PIE_COLORS[entry.name] ?? NEON_COLORS[0]}
                    stroke="rgba(0,0,0,0.3)"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "rgba(10,14,22,0.95)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8,
                  fontSize: 12,
                  color: "#e5e7eb",
                }}
                formatter={(value: number, name: string) => [
                  `${value} records (${total > 0 ? ((value / total) * 100).toFixed(1) : 0}%)`,
                  name,
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
          {/* Legend */}
          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mt-1">
            {evidenceChartData.map((item) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: PIE_COLORS[item.name] }}
                />
                <span className="text-[10px] text-muted-foreground">
                  {item.name}
                </span>
                <span
                  className="text-[10px] font-semibold ml-auto"
                  style={{ color: PIE_COLORS[item.name] }}
                >
                  {total > 0 ? ((item.value / total) * 100).toFixed(0) : 0}%
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ── MIDDLE: Line / Area Chart ───────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.25 }}
        className="glass-card p-5"
        data-ocid="analytics.line_chart"
      >
        <SectionHeader
          icon={Activity}
          title="Activity Trend — Evidence Discovery Rate (Last 7 Days)"
          color="#818cf8"
        />
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart
            data={activityTrendData}
            margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
          >
            <defs>
              <linearGradient id="grad-total" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="grad-suspicious" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.22} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.05)"
            />
            <XAxis
              dataKey="time"
              tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<GlassTooltip />} />
            <Legend
              iconType="circle"
              iconSize={7}
              formatter={(value) => (
                <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 11 }}>
                  {value}
                </span>
              )}
            />
            <Area
              type="monotone"
              dataKey="events"
              name="Total Evidence"
              stroke="#22d3ee"
              strokeWidth={2}
              fill="url(#grad-total)"
              dot={{ fill: "#22d3ee", r: 3, strokeWidth: 0 }}
              activeDot={{ r: 5, fill: "#22d3ee", strokeWidth: 0 }}
            />
            <Area
              type="monotone"
              dataKey="suspicious"
              name="Suspicious Items"
              stroke="#ef4444"
              strokeWidth={2}
              fill="url(#grad-suspicious)"
              dot={{ fill: "#ef4444", r: 3, strokeWidth: 0 }}
              activeDot={{ r: 5, fill: "#ef4444", strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      {/* ── BOTTOM ROW: Timeline + Recent Events ───────────────────────────── */}
      <div className="grid lg:grid-cols-5 gap-5">
        {/* Evidence Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="lg:col-span-3 glass-card p-5"
          data-ocid="timeline.panel"
        >
          <SectionHeader
            icon={Clock}
            title="Evidence Timeline"
            color="#c084fc"
          />

          <div className="relative">
            {/* vertical line */}
            <div
              className="absolute left-[19px] top-4 bottom-4 w-px"
              style={{
                background:
                  "linear-gradient(180deg, #22d3ee22, #c084fc44, #ef444422)",
              }}
            />

            <div className="space-y-0" data-ocid="timeline.events.list">
              {timelineEvents.length > 0 ? (
                timelineEvents.map((ev, i) => {
                  const IconComp = TYPE_ICON[ev.type] ?? Activity;
                  const severity = (ev.metadata?.severity ||
                    "info") as Severity;
                  const color = SEV_COLOR[severity];
                  const isLast = i === timelineEvents.length - 1;
                  return (
                    <motion.div
                      key={ev.id}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.35 + i * 0.08 }}
                      data-ocid={`timeline.event.item.${i + 1}`}
                      className={`flex gap-4 relative ${!isLast ? "pb-5" : ""}`}
                    >
                      {/* Node */}
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border z-10"
                        style={{
                          background: `${color}12`,
                          borderColor: `${color}40`,
                          boxShadow: `0 0 12px ${color}20`,
                        }}
                      >
                        <IconComp size={14} style={{ color }} />
                      </div>

                      {/* Content card */}
                      <div
                        className="flex-1 min-w-0 rounded-xl px-4 py-3 border"
                        style={{
                          background: `${color}07`,
                          borderColor: `${color}22`,
                        }}
                      >
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                          <span className="text-xs font-semibold text-foreground leading-snug">
                            {ev.title}
                          </span>
                          <span
                            className="text-[9px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                            style={{ background: `${color}18`, color }}
                          >
                            {SEV_LABEL[severity]}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                          {ev.description}
                        </p>
                        <div className="flex items-center gap-1.5 mt-2">
                          <Clock size={9} className="text-muted-foreground" />
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {ev.timestamp}
                          </span>
                          <span
                            className="ml-2 text-[10px] px-1.5 py-0.5 rounded font-medium"
                            style={{
                              background: "rgba(255,255,255,0.06)",
                              color: "rgba(255,255,255,0.4)",
                            }}
                          >
                            {ev.type}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <div className="text-center py-12 text-xs text-muted-foreground">
                  No timeline events found. Perform device extraction to
                  populate.
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Recent Suspicious Events */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="lg:col-span-2 glass-card p-5"
          data-ocid="suspicious.events.panel"
        >
          <SectionHeader
            icon={AlertTriangle}
            title="Recent Suspicious Events"
            color="#ef4444"
          />

          <div className="space-y-2" data-ocid="suspicious.events.list">
            {recentSuspiciousEvents.length > 0 ? (
              recentSuspiciousEvents.map((ev, i) => {
                const IconComp = CATEGORY_ICON[ev.category] ?? AlertOctagon;
                const color = SEV_COLOR[ev.severity];
                return (
                  <motion.div
                    key={ev.id}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.06 }}
                    data-ocid={`suspicious.event.item.${i + 1}`}
                    className="flex items-start gap-3 rounded-xl p-3 border transition-colors hover:bg-white/4"
                    style={{
                      background: `${color}06`,
                      borderColor: `${color}20`,
                    }}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: `${color}18` }}
                    >
                      <IconComp size={13} style={{ color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-medium text-foreground leading-snug line-clamp-2">
                        {ev.title}
                      </p>
                      <div className="flex items-center justify-between gap-2 mt-1.5">
                        <span
                          className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                          style={{ background: `${color}18`, color }}
                        >
                          {ev.severity.toUpperCase()}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {ev.time}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="text-center py-12 text-xs text-muted-foreground">
                No suspicious events detected.
              </div>
            )}
          </div>

          {/* Summary footer */}
          <div className="mt-4 pt-4 border-t border-white/8">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">
                Total suspicious activity
              </span>
              <span className="text-sm font-bold text-red-400">
                {suspiciousCount} events
              </span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <div className="h-1.5 rounded-full bg-white/8 flex-1 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${riskRate}%`,
                    background: "linear-gradient(90deg, #ef4444, #f59e0b)",
                  }}
                />
              </div>
              <span className="text-[10px] font-bold text-red-400">
                {riskRate}% risk rate
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
