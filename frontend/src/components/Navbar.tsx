'use client';

import React from 'react';
import Link from 'next/link';
import { Link2, Sparkles } from 'lucide-react';
import { UserButton, SignInButton, SignedIn, SignedOut } from '@clerk/nextjs';

export function Navbar() {
  const hasClerkKey = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  return (
    <header className="border-b border-slate-200/80 bg-white/75 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <Link2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xl font-bold bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-700 bg-clip-text text-transparent">
              LinkShort
            </span>
            <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Dub.co Clone
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          {hasClerkKey ? (
            <>
              <SignedIn>
                <UserButton afterSignOutUrl="/" />
              </SignedIn>
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="text-sm font-medium px-4 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-sm">
                    Sign In
                  </button>
                </SignInButton>
              </SignedOut>
            </>
          ) : (
            <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Full Analytics Active</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
