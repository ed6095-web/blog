import Head from 'next/head';
import { SignUpPage } from '@/components/ui/sign-in-flow-1';

export default function Signup() {
  return (
    <>
      <Head>
        <title>Sign Up · Wavvy</title>
      </Head>
      <SignUpPage />
    </>
  );
}
