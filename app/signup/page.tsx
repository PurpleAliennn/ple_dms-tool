'use client'

import { useActionState } from 'react';
import { signUp } from '../actions/auth';

export default function SignupPage() {

  const [state, formAction] = useActionState(signUp, null);

  return (
    <form action={formAction}>
      <input name="email" type="email" required placeholder="Email" />
      <input name="password" type="password" required placeholder="Password" />
      <button type="submit">Create Account</button>
      
      {state?.error && <p style={{ color: 'red' }}>{state.error}</p>}
      {state?.data && <p style={{ color: 'green' }}>Account created! Check your email.</p>}
    </form>
  );
  
}