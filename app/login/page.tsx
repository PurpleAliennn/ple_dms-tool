'use client'

import { useActionState } from 'react';
import { signIn } from '../actions/auth'; // You'll need to create this action
import Link from 'next/link';

export default function LoginPage() {
  const [state, formAction] = useActionState(signIn, null);

  return (
    <form action={formAction}>
      <h2>Log In</h2>
      <input name="email" type="email" required placeholder="Email" />
      <input name="password" type="password" required placeholder="Password" />
      <button type="submit">Sign In</button>
      
      {state?.error && <p style={{ color: 'red' }}>{state.error}</p>}
      
      <p>
        Don't have an account? <Link href="/signup">Sign up here</Link>
      </p>
    </form>
  );
}