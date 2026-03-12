import Link from 'next/link';
import { Zap } from 'lucide-react';

export function LandingFooter() {
  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto max-w-6xl px-4 py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 font-bold text-lg mb-3">
              <Zap className="h-5 w-5" />
              Nexar AI
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Open source AI for grant discovery. Find every grant that matches your mission.
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-sm font-semibold mb-4">Product</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>
                <Link href="/register" className="hover:text-foreground transition-colors">
                  Get started
                </Link>
              </li>
              <li>
                <Link href="/search" className="hover:text-foreground transition-colors">
                  Search grants
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-sm font-semibold mb-4">Resources</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>
                <a
                  href="https://github.com/sakshit2004/Nexar-AI"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors"
                >
                  GitHub
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/sakshit2004/Nexar-AI/blob/main/CONTRIBUTING.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors"
                >
                  Contributing
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold mb-4">Legal</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>
                <a
                  href="https://github.com/sakshit2004/Nexar-AI/blob/main/LICENSE"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors"
                >
                  License
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-8 border-t flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Nexar AI. Open source under MIT License.</p>
          <p>Built with ❤️ for nonprofits &amp; grant seekers</p>
        </div>
      </div>
    </footer>
  );
}
