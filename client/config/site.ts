export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "YumeAI",
  description: "Yume like Ai with Your AI",
  version: "0.39",
  navItems: [
    {
      label: "채팅",
      href: "/rooms",
    },
    {
      label: "페르소나",
      href: "/personas",
    },
    {
      label: "봇",
      href: "/bots",
    },
    {
      label: "프롬프트",
      href: "/prompts",
    },
    {
      label: "설정",
      href: "/settings",
    },
  ],
};
