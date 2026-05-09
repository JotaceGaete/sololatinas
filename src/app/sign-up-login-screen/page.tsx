import React, { Suspense } from 'react';
import AuthClient from './components/AuthClient';

export default function SignUpLoginPage() {
  return (
    <Suspense fallback={null}>
      <AuthClient />
    </Suspense>
  );
}
