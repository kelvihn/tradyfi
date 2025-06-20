// src/components/Footer.tsx
import { Shield } from "lucide-react";
import React from "react";
import Logo from "./logo";

const Footer = () => {
  return (
    <footer className="bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <Logo/>
            <p className="text-slate-400 mb-4">
              Professional crypto trading platform connecting independent traders with users through personalized portals.
            </p>
            <div className="space-y-2 text-sm text-slate-400">
              <p>Lagos, Nigeria</p>
              <p>
                <a href="tel:+2348186586280" className="hover:text-white transition-colors">
                  +234 818 658 6280
                </a>
              </p>
              <p>
                <a href="mailto:hey@tradyfi.ng" className="hover:text-white transition-colors">
                  hey@tradyfi.ng
                </a>
              </p>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Platform</h4>
            <ul className="space-y-2 text-slate-400">
              <li>
                <a href="/register" className="hover:text-white transition-colors">
                  Become a Trader
                </a>
              </li>
              <li>
                <a href="/login" className="hover:text-white transition-colors">
                  Login
                </a>
              </li>
              {/* <li>
                <a href="#features" className="hover:text-white transition-colors">
                  Features
                </a>
              </li> */}
              {/* <li>
                <a href="#how-it-works" className="hover:text-white transition-colors">
                  How It Works
                </a>
              </li> */}
              {/* <li>
                <a href="mailto:security@tradyfi.ng" className="hover:text-white transition-colors">
                  Security
                </a>
              </li> */}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-slate-400">
              <li>
                <a href="/contact" className="hover:text-white transition-colors">
                  Contact Us
                </a>
              </li>
              {/* <li>
                <a href="mailto:help@tradyfi.ng" className="hover:text-white transition-colors">
                  Help Center
                </a>
              </li> */}
              {/* <li>
                <a href="mailto:support@tradyfi.ng" className="hover:text-white transition-colors">
                  Verification Process
                </a>
              </li> */}
              {/* <li>
                <a href="mailto:emergency@tradyfi.ng" className="hover:text-white transition-colors">
                  Emergency Support
                </a>
              </li> */}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-slate-400">
              <li>
                <a href="/privacy-policy" className="hover:text-white transition-colors">
                  Privacy Policy
                </a>
              </li>
              {/* <li>
                <a href="/terms-of-service" className="hover:text-white transition-colors">
                  Terms of Service
                </a>
              </li> */}
              {/* <li>
                <a href="mailto:compliance@tradyfi.ng" className="hover:text-white transition-colors">
                  Compliance
                </a>
              </li> */}
              {/* <li>
                <a href="mailto:privacy@tradyfi.ng" className="hover:text-white transition-colors">
                  Data Protection
                </a>
              </li> */}
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-8 mt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-slate-400 text-sm">
            © 2025 Tradyfi.ng. All rights reserved.
          </p>
          <div className="flex items-center space-x-6 mt-4 md:mt-0">
            <div className="flex items-center text-slate-400 text-sm">
              <Shield className="text-green-500 mr-2 h-4 w-4" />
              NIN Verified Platform
            </div>
            <div className="flex space-x-4 text-slate-400">
              <a href="#" className="hover:text-white transition-colors" aria-label="TikTok">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
                </svg>
              </a>
              <a href="#" className="hover:text-white transition-colors" aria-label="Instagram">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <a href="#" className="hover:text-white transition-colors" aria-label="Facebook">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;