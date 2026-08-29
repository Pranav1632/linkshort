import React from 'react';
import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="flex items-center justify-center min-h-[75vh] py-12">
      <div className="p-1 rounded-3xl bg-gradient-to-b from-slate-200 to-slate-100 shadow-2xl shadow-slate-200/50">
        <SignUp />
      </div>
    </div>
  );
}
