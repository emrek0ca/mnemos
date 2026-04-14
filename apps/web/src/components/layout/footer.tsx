import Link from 'next/link';
import { Brain, Twitter, Github, Linkedin } from 'lucide-react';

const footerLinks = {
    product: [
        { name: 'Features', href: '/product' },
        { name: 'Use Cases', href: '/use-cases' },
        { name: 'Pricing', href: '/pricing' },
        { name: 'Changelog', href: '/changelog' },
    ],
    developers: [
        { name: 'Documentation', href: '/docs' },
        { name: 'API Reference', href: '/docs/api' },
        { name: 'SDKs', href: '/docs/sdks' },
        { name: 'Status', href: '/status' },
    ],
    company: [
        { name: 'About', href: '/about' },
        { name: 'Blog', href: '/blog' },
        { name: 'Careers', href: '/careers' },
        { name: 'Contact', href: '/contact' },
    ],
    legal: [
        { name: 'Privacy', href: '/privacy' },
        { name: 'Terms', href: '/terms' },
        { name: 'Security', href: '/security' },
    ],
};

export function Footer() {
    return (
        <footer className="bg-slate-900 text-slate-400">
            <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
                    {/* Brand */}
                    <div className="col-span-2 md:col-span-1">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500">
                                <Brain className="h-5 w-5 text-white" />
                            </div>
                            <span className="text-xl font-bold text-white">WIQO</span>
                        </Link>
                        <p className="mt-4 text-sm leading-relaxed">
                            Cognitive intelligence for consistent decision-making.
                        </p>
                        <div className="mt-6 flex gap-4">
                            <a href="#" className="hover:text-white transition-colors">
                                <Twitter className="h-5 w-5" />
                            </a>
                            <a href="#" className="hover:text-white transition-colors">
                                <Github className="h-5 w-5" />
                            </a>
                            <a href="#" className="hover:text-white transition-colors">
                                <Linkedin className="h-5 w-5" />
                            </a>
                        </div>
                    </div>

                    {/* Links */}
                    <div>
                        <h3 className="text-sm font-semibold text-white mb-4">Product</h3>
                        <ul className="space-y-3">
                            {footerLinks.product.map((link) => (
                                <li key={link.name}>
                                    <Link href={link.href} className="text-sm hover:text-white transition-colors">
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold text-white mb-4">Developers</h3>
                        <ul className="space-y-3">
                            {footerLinks.developers.map((link) => (
                                <li key={link.name}>
                                    <Link href={link.href} className="text-sm hover:text-white transition-colors">
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold text-white mb-4">Company</h3>
                        <ul className="space-y-3">
                            {footerLinks.company.map((link) => (
                                <li key={link.name}>
                                    <Link href={link.href} className="text-sm hover:text-white transition-colors">
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold text-white mb-4">Legal</h3>
                        <ul className="space-y-3">
                            {footerLinks.legal.map((link) => (
                                <li key={link.name}>
                                    <Link href={link.href} className="text-sm hover:text-white transition-colors">
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="mt-12 pt-8 border-t border-slate-800">
                    <p className="text-sm text-center">
                        © {new Date().getFullYear()} WIQO Cognitive Engine. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
}
