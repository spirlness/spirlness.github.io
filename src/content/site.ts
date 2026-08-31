export const siteProfile = {
  name: "Li Fuying",
  navTitle: "LI FUYING",
  title: "Li Fuying",
  description: "Personal academic website for Li Fuying",
  url: "https://spirlness.github.io",
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
  focusAreas: [
    {
      title: "Algorithmic Resilience",
      description:
        "Stability guarantees for neural physical systems under distribution shift, noise, and symmetry-breaking perturbations.",
    },
    {
      title: "Neural-Symbolic Physics",
      description:
        "Combining learned latent dynamics with symbolic constraints so models recover conservation laws, not only fit trajectories.",
    },
    {
      title: "Physics-Informed Learning",
      description:
        "Surrogate models and operators for PDEs that embed Hamiltonian and geometric structure for sample-efficient generalization.",
    },
  ],
} as const;
