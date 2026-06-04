// icons.jsx — clean stroke line icons (Lucide/Geist style)
const Ic = ({ d, size = 18, sw = 1.6, fill = "none", children, style, ...p }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill}
    stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
    style={style} {...p}>
    {d ? <path d={d} /> : children}
  </svg>
);

const IconSearch    = (p) => <Ic {...p}><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></Ic>;
const IconSend      = (p) => <Ic {...p}><path d="M3.5 12 21 4l-5.5 16-4-7-7.5-1Z" /><path d="m11.5 12.5 4-4.5" /></Ic>;
const IconPaperclip = (p) => <Ic {...p} d="M21 11.5 12.5 20a5 5 0 0 1-7-7l8-8a3.3 3.3 0 0 1 4.7 4.7l-8 8a1.6 1.6 0 0 1-2.3-2.3l7.3-7.3" />;
const IconPlus      = (p) => <Ic {...p}><path d="M12 5v14M5 12h14" /></Ic>;
const IconChat      = (p) => <Ic {...p}><path d="M21 12a8 8 0 0 1-11.5 7.2L4 21l1.8-5.5A8 8 0 1 1 21 12Z" /></Ic>;
const IconGrid      = (p) => <Ic {...p}><rect x="3" y="3" width="7.5" height="7.5" rx="1.5"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5"/></Ic>;
const IconShield    = (p) => <Ic {...p}><path d="M12 3 5 6v5c0 4.2 2.9 7.6 7 9 4.1-1.4 7-4.8 7-9V6l-7-3Z"/><path d="m9 12 2 2 4-4"/></Ic>;
const IconUsers     = (p) => <Ic {...p}><circle cx="9" cy="8" r="3.2"/><path d="M3.5 20a5.5 5.5 0 0 1 11 0"/><path d="M16 5.2a3.2 3.2 0 0 1 0 5.6"/><path d="M18 14.5a5.5 5.5 0 0 1 2.5 4.5"/></Ic>;
const IconFile      = (p) => <Ic {...p}><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z"/><path d="M14 3v5h5"/></Ic>;
const IconBuilding  = (p) => <Ic {...p}><path d="M4 21V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v15"/><path d="M14 9h4a2 2 0 0 1 2 2v10"/><path d="M3 21h18"/><path d="M8 8h2M8 12h2M8 16h2"/></Ic>;
const IconList      = (p) => <Ic {...p}><path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01"/></Ic>;
const IconSettings  = (p) => <Ic {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 0 1-4 0v-.2A1.6 1.6 0 0 0 7 19.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.6 1.6 0 0 0 3 13.9H3a2 2 0 0 1 0-4h.1A1.6 1.6 0 0 0 4.6 7L4.5 7a2 2 0 1 1 2.8-2.8l.1.1A1.6 1.6 0 0 0 10 3.6V3a2 2 0 0 1 4 0v.1a1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1Z"/></Ic>;
const IconBell      = (p) => <Ic {...p}><path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z"/><path d="M10.5 20a2 2 0 0 0 3 0"/></Ic>;
const IconSpark     = (p) => <Ic {...p}><path d="M12 3l1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6L12 3Z"/><path d="M19 4l.7 2 .3-2 2-.7-2-.3-.3-2-.7 2-2 .3 2 .7Z" opacity=".7"/></Ic>;
const IconChevDown  = (p) => <Ic {...p}><path d="m6 9 6 6 6-6"/></Ic>;
const IconChevRight = (p) => <Ic {...p}><path d="m9 6 6 6-6 6"/></Ic>;
const IconChevLeft  = (p) => <Ic {...p}><path d="m15 6-6 6 6 6"/></Ic>;
const IconPanelLeft = (p) => <Ic {...p}><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16"/></Ic>;
const IconLogout    = (p) => <Ic {...p}><path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3"/><path d="M10 17l5-5-5-5"/><path d="M15 12H3"/></Ic>;
const IconMail      = (p) => <Ic {...p}><rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="m3.5 7 8.5 6 8.5-6"/></Ic>;
const IconArrowUpR  = (p) => <Ic {...p}><path d="M7 17 17 7M9 7h8v8"/></Ic>;
const IconClock     = (p) => <Ic {...p}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></Ic>;
const IconDot       = ({ size = 8, color = "currentColor" }) => <span style={{ display:"inline-block", width:size, height:size, borderRadius:99, background:color }} />;
const IconUpload    = (p) => <Ic {...p}><path d="M12 16V4m0 0L7 9m5-5 5 5"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/></Ic>;
const IconCheck     = (p) => <Ic {...p}><path d="m4 12 5 5L20 6"/></Ic>;
const IconFilter    = (p) => <Ic {...p}><path d="M3 5h18l-7 8v6l-4-2v-4L3 5Z"/></Ic>;
const IconWarn      = (p) => <Ic {...p}><path d="M12 3 2 20h20L12 3Z"/><path d="M12 10v4M12 17h.01"/></Ic>;
const IconGauge     = (p) => <Ic {...p}><path d="M3 16a9 9 0 1 1 18 0"/><path d="m12 16 4-5"/><circle cx="12" cy="16" r="1.4" fill="currentColor" stroke="none"/></Ic>;
const IconFlask     = (p) => <Ic {...p}><path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4A2 2 0 0 0 19 18l-5-9V3"/><path d="M7.5 14h9"/></Ic>;
const IconWrench    = (p) => <Ic {...p}><path d="M15 6a4 4 0 0 0-5.3 4.7L4 16.4 7.6 20l5.7-5.7A4 4 0 0 0 18 9l-2.3 2.3-2-2L16 7"/></Ic>;
const IconRefresh   = (p) => <Ic {...p}><path d="M21 8a8 8 0 0 0-14-3L3 8m0 0V3m0 5h5"/><path d="M3 16a8 8 0 0 0 14 3l4-3m0 0v5m0-5h-5"/></Ic>;
const IconMore      = (p) => <Ic {...p}><circle cx="5" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.4" fill="currentColor" stroke="none"/></Ic>;
const IconStop      = (p) => <Ic {...p}><rect x="6" y="6" width="12" height="12" rx="2.5" fill="currentColor" stroke="none"/></Ic>;

Object.assign(window, {
  IconSearch, IconSend, IconPaperclip, IconPlus, IconChat, IconGrid, IconShield,
  IconUsers, IconFile, IconBuilding, IconList, IconSettings, IconBell, IconSpark,
  IconChevDown, IconChevRight, IconChevLeft, IconPanelLeft, IconLogout, IconMail,
  IconArrowUpR, IconClock, IconDot, IconUpload, IconCheck, IconFilter, IconWarn,
  IconGauge, IconFlask, IconWrench, IconRefresh, IconMore, IconStop,
});
