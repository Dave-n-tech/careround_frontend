type IconProps = {
  d: string | string[];
  size?: number;
  fill?: boolean;
  stroke?: number;
  className?: string;
};

export function Icon({ d, size = 16, fill = false, stroke = 2, className = "" }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {Array.isArray(d)
        ? d.map((p, i) => <path key={i} d={p} />)
        : <path d={d} />}
    </svg>
  );
}

export const Icons = {
  dashboard: (p: Omit<IconProps, "d">) => (
    <Icon {...p} d={["M3 12l9-9 9 9", "M5 10v10h14V10"]} />
  ),
  patients: (p: Omit<IconProps, "d">) => (
    <Icon
      {...p}
      d={[
        "M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
        "M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6",
        "M17 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
        "M14 14c4 0 7 2.7 7 6"
      ]}
    />
  ),
  rounds: (p: Omit<IconProps, "d">) => (
    <Icon {...p} d={["M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z", "M12 7v5l3 2"]} />
  ),
  tasks: (p: Omit<IconProps, "d">) => (
    <Icon
      {...p}
      d={[
        "M4 6h16",
        "M4 12h16",
        "M4 18h10",
        "M9 4l1 2 2-2",
        "M9 16l1 2 2-2"
      ]}
    />
  ),
  escalation: (p: Omit<IconProps, "d">) => (
    <Icon {...p} d={["M12 3l10 18H2L12 3Z", "M12 10v5", "M12 18h.01"]} />
  ),
  team: (p: Omit<IconProps, "d">) => (
    <Icon
      {...p}
      d={[
        "M16 4a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z",
        "M8 4a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z",
        "M2 20c0-3 2.5-5 6-5s6 2 6 5",
        "M22 20c0-3-2-5-5-5"
      ]}
    />
  ),
  shift: (p: Omit<IconProps, "d">) => (
    <Icon {...p} d={["M3 7h18v13H3z", "M3 7l3-4h12l3 4", "M8 12h8"]} />
  ),
  handover: (p: Omit<IconProps, "d">) => (
    <Icon {...p} d={["M3 12h18", "M14 5l7 7-7 7", "M3 8V5", "M3 19v-3"]} />
  ),
  reports: (p: Omit<IconProps, "d">) => (
    <Icon {...p} d={["M4 20V8", "M10 20V4", "M16 20v-8", "M22 20H2"]} />
  ),
  settings: (p: Omit<IconProps, "d">) => (
    <Icon
      {...p}
      d={[
        "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
        "M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.7 1.7 0 0 0 9 4.6 1.7 1.7 0 0 0 10 3.1V3a2 2 0 1 1 4 0v.1A1.7 1.7 0 0 0 15 4.6a1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"
      ]}
    />
  ),
  bell: (p: Omit<IconProps, "d">) => (
    <Icon {...p} d={["M6 8a6 6 0 1 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9Z", "M10 21a2 2 0 0 0 4 0"]} />
  ),
  search: (p: Omit<IconProps, "d">) => (
    <Icon {...p} d={["M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z", "M21 21l-4.3-4.3"]} />
  ),
  plus: (p: Omit<IconProps, "d">) => <Icon {...p} d={["M12 5v14", "M5 12h14"]} />,
  check: (p: Omit<IconProps, "d">) => <Icon {...p} d={["M5 13l4 4L19 7"]} />,
  x: (p: Omit<IconProps, "d">) => <Icon {...p} d={["M18 6 6 18", "M6 6l12 12"]} />,
  chevron: (p: Omit<IconProps, "d">) => <Icon {...p} d={["M9 6l6 6-6 6"]} />,
  chevDown: (p: Omit<IconProps, "d">) => <Icon {...p} d={["M6 9l6 6 6-6"]} />,
  arrow: (p: Omit<IconProps, "d">) => <Icon {...p} d={["M5 12h14", "M13 6l6 6-6 6"]} />,
  refresh: (p: Omit<IconProps, "d">) => (
    <Icon
      {...p}
      d={[
        "M3 12a9 9 0 0 1 15.5-6.3L21 8",
        "M21 3v5h-5",
        "M21 12a9 9 0 0 1-15.5 6.3L3 16",
        "M3 21v-5h5"
      ]}
    />
  ),
  vitals: (p: Omit<IconProps, "d">) => <Icon {...p} d={["M3 12h4l2-7 4 14 2-7h6"]} />,
  hospital: (p: Omit<IconProps, "d">) => (
    <Icon {...p} d={["M4 21V8l8-5 8 5v13", "M9 21v-6h6v6", "M12 11v-3", "M10.5 9.5h3"]} />
  ),
  building: (p: Omit<IconProps, "d">) => (
    <Icon
      {...p}
      d={[
        "M4 21h16",
        "M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16",
        "M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2"
      ]}
    />
  ),
  bed: (p: Omit<IconProps, "d">) => (
    <Icon {...p} d={["M3 18V6", "M3 12h18v6", "M21 18V10a2 2 0 0 0-2-2h-9v4", "M7 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"]} />
  ),
  logout: (p: Omit<IconProps, "d">) => (
    <Icon {...p} d={["M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4", "M16 17l5-5-5-5", "M21 12H9"]} />
  ),
  more: (p: Omit<IconProps, "d">) => <Icon {...p} d={["M12 7h.01M12 12h.01M12 17h.01"]} stroke={3} />,
  edit: (p: Omit<IconProps, "d">) => (
    <Icon {...p} d={["M12 20h9", "M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5Z"]} />
  ),
  trash: (p: Omit<IconProps, "d">) => (
    <Icon {...p} d={["M3 6h18", "M8 6V4h8v2", "M6 6l1 15h10l1-15", "M10 11v6", "M14 11v6"]} />
  ),
  alertCircle: (p: Omit<IconProps, "d">) => (
    <Icon {...p} d={["M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z", "M12 8v4", "M12 16h.01"]} />
  ),
  arrowUp: (p: Omit<IconProps, "d">) => <Icon {...p} d={["M12 19V5", "M5 12l7-7 7 7"]} />,
  arrowDown: (p: Omit<IconProps, "d">) => <Icon {...p} d={["M12 5v14", "M19 12l-7 7-7-7"]} />,
  pause: (p: Omit<IconProps, "d">) => <Icon {...p} d={["M6 4h4v16H6z", "M14 4h4v16h-4z"]} fill={true} />,
  play: (p: Omit<IconProps, "d">) => <Icon {...p} d={["M5 3l14 9-14 9V3Z"]} fill={true} />
};
