export const siteProfile = {
  name: "Li Fuying",
  navTitle: "LI FUYING",
  title: "Li Fuying",
  description: "Personal academic website for Li Fuying",
  authorInitial: "L",
  authorRole: "Physics & Deep Learning Researcher",
  heroTitle: ["Physics, Intelligence,", "& Complexity."],
  researchSummary:
    "I am a researcher exploring the intersection of Theoretical Physics and Deep Learning. My current work focuses on algorithmic resilience and neural-symbolic systems.",
  currentWork:
    "Currently, I am investigating how symmetries in physical systems can be used to improve the generalization capabilities of neural networks, particularly in low-data regimes.",
  contactIntro:
    "I am always open to discussions on physics-informed ML, symbolic AI, or complex systems.",
  links: [
    {
      label: "Google Scholar",
      href: "https://scholar.google.com/scholar?q=Li+Fuying",
    },
    {
      label: "GitHub",
      href: "https://github.com/spirlness",
    },
  ],
  navLinks: [
    { href: "/", label: "HOME" },
    { href: "/projects/", label: "PROJECTS" },
    { href: "/publications/", label: "PUBLICATIONS" },
    { href: "/blog/", label: "BLOG" },
  ],
  publicationAuthorNames: ["Li, Fuying", "Fuying Li", "Li Fuying"],
  publicationsIntro:
    "Selected works in physics-informed machine learning and fluid simulation.",
} as const;
