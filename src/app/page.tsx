import { Calendar, Award, BookOpen, GraduationCap } from "lucide-react";

export default function Home() {
  const links = [
    {
      label: "Google Scholar",
      href: "https://scholar.google.com/scholar?q=Li+Fuying",
    },
    {
      label: "GitHub",
      href: "https://github.com/spirlness",
    },
  ];

  const updates = [
    {
      date: "2024-04",
      content: "Paper 'Algorithmic Resilience' accepted at ICLR 2024.",
      icon: <Award className="w-4 h-4 text-orange-500" />,
    },
    {
      date: "2024-02",
      content: "Invited talk at Perimeter Institute for Theoretical Physics.",
      icon: <BookOpen className="w-4 h-4 text-blue-500" />,
    },
    {
      date: "2023-12",
      content: "Successfully defended PhD thesis on Neural Symbolic Integration.",
      icon: <GraduationCap className="w-4 h-4 text-purple-500" />,
    },
  ];

  return (
    <div className="distill-grid py-16">
      <div />
      <main>
        <section className="mb-24">
          <p className="font-display text-sm font-bold tracking-widest text-accent uppercase mb-5">
            Li Fuying
          </p>
          <h1 className="font-display text-6xl font-bold tracking-tight mb-8 text-gray-900">
            Physics, Intelligence, <br />
            & Complexity.
          </h1>
          <div className="text-xl leading-relaxed text-gray-700 space-y-6 max-w-2xl">
            <p>
              I am a researcher exploring the intersection of <span className="text-accent font-medium italic underline decoration-orange-200 decoration-4 underline-offset-4">Theoretical Physics</span> and <span className="text-accent font-medium italic underline decoration-orange-200 decoration-4 underline-offset-4">Deep Learning</span>. My current work focuses on 
              algorithmic resilience and neural-symbolic systems.
            </p>
            <p>
              Currently, I am investigating how symmetries in physical systems can be used to improve the generalization
              capabilities of neural networks, particularly in low-data regimes.
            </p>
          </div>
        </section>

        <section className="mb-24">
          <h2 className="font-display text-2xl font-bold mb-12 flex items-center gap-3 tracking-widest text-gray-400 uppercase">
            <Calendar className="w-5 h-5" />
            Latest Updates
          </h2>
          <div className="space-y-12">
            {updates.map((update, index) => (
              <div key={index} className="flex gap-8 relative group">
                {index !== updates.length - 1 && (
                  <div className="absolute left-[18px] top-8 bottom-[-48px] w-px bg-gray-100 group-hover:bg-orange-100 transition-colors" />
                )}
                <div className="flex-none w-9 h-9 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center relative z-10 group-hover:border-orange-200 transition-colors">
                  {update.icon}
                </div>
                <div className="pt-1.5 pb-2">
                  <span className="text-sm font-mono text-gray-400 mb-2 block tracking-tighter">
                    {update.date}
                  </span>
                  <p className="text-lg text-gray-700 leading-snug">
                    {update.content}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="p-12 bg-gray-50 rounded-2xl border border-gray-100">
          <h3 className="font-display text-xl font-bold mb-4">Contact & Information</h3>
          <p className="text-gray-600 mb-8 leading-relaxed">
            I am always open to discussions on physics-informed ML, symbolic AI, or complex systems.
          </p>
          <div className="flex flex-wrap gap-6 font-display text-sm font-medium text-gray-500">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-accent underline underline-offset-4 decoration-gray-200"
              >
                {link.label}
              </a>
            ))}
          </div>
        </section>
      </main>
      <div />
    </div>
  );
}
