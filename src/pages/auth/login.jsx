import Head from 'next/head';
import { SignInPage } from '@/components/ui/sign-in-flow-1';

export default function Login() {
  return (
    <>
      <Head>
        <title>Login · Wavvy</title>
      </Head>
      <SignInPage />
    </>
  );
}
