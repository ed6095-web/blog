// src/pages/auth/login.jsx
import { useRouter } from "next/router";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import AuthForm from "../../components/AuthForm";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { useState } from "react";

export default function LoginPage() {
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async ({ email, password }) => {
    setError("");
    try {
      const auth = getAuth();
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/"); // Redirect after login
    } catch (e) {
      setError(e.message || "Login failed");
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-tr from-purple-100 via-blue-50 to-pink-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex flex-col relative">
      <Navbar />
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-lg mx-auto p-4">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-center mb-6 bg-gradient-to-tr from-blue-600 to-fuchsia-500 bg-clip-text text-transparent">
            Login to Your Account
          </h2>
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-100 text-red-800 dark:bg-red-900/80 dark:text-red-200 font-medium text-center shadow">
              {error}
            </div>
          )}
          <AuthForm onSubmit={handleLogin} />
        </div>
      </div>
      <Footer />
    </div>
  );
}
