import { useState } from "react";
import { loginUser, registerUser, setAuthToken } from "../services/api";
import { useNavigate } from "react-router-dom";
import SharedLayout from "../components/SharedLayout";

export default function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const backgroundImage = `linear-gradient(rgba(2,6,23,0.62), rgba(2,6,23,0.62)), url(${process.env.PUBLIC_URL}/app-background.jpg)`;

  const getErrorMessage = (err: unknown, fallback: string) => {
    if (
      typeof err === "object" &&
      err !== null &&
      "response" in err &&
      typeof err.response === "object" &&
      err.response !== null &&
      "data" in err.response &&
      typeof err.response.data === "object" &&
      err.response.data !== null &&
      "message" in err.response.data &&
      typeof err.response.data.message === "string"
    ) {
      return err.response.data.message;
    }

    return fallback;
  };

  const handleRegister = async () => {
    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedUsername || !trimmedEmail || !password || !confirmPassword) {
      setError("All fields are required");
      return;
    }

    if (!emailPattern.test(trimmedEmail)) {
      setError("Enter a valid email address");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await registerUser({
        username: trimmedUsername,
        email: trimmedEmail,
        password,
      });

      const loginResponse = await loginUser({
        username: trimmedUsername,
        password,
      });

      localStorage.setItem("token", loginResponse.data.token);
      localStorage.setItem("user", JSON.stringify(loginResponse.data.user));
      setAuthToken(loginResponse.data.token);
      navigate("/dashboard");
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Registration failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SharedLayout variant="auth" backgroundImage={backgroundImage}>
      <div className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-6 shadow-lg transition duration-300 hover:scale-[1.01] hover:shadow-2xl">
        <h2 className="mb-5 text-center text-2xl font-bold text-slate-900">Register</h2>

        <input
          className="mb-3 w-full rounded border border-slate-300 p-2 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          type="email"
          className="mb-3 w-full rounded border border-slate-300 p-2 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <div className="mb-3 flex rounded border border-slate-300 focus-within:border-green-500 focus-within:ring-2 focus-within:ring-green-100">
          <input
            type={showPassword ? "text" : "password"}
            className="min-w-0 flex-1 rounded-l p-2 outline-none"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            type="button"
            onClick={() => setShowPassword((visible) => !visible)}
            className="rounded-r px-3 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>

        <div className="mb-3 flex rounded border border-slate-300 focus-within:border-green-500 focus-within:ring-2 focus-within:ring-green-100">
          <input
            type={showPassword ? "text" : "password"}
            className="min-w-0 flex-1 rounded-l p-2 outline-none"
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          <button
            type="button"
            onClick={() => setShowPassword((visible) => !visible)}
            className="rounded-r px-3 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>

        <button
          onClick={handleRegister}
          disabled={loading}
          className="w-full rounded bg-green-600 p-2 font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-green-300"
        >
          {loading ? "Creating..." : "Register"}
        </button>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <p className="mt-4 text-center text-sm text-slate-600">
          Already have an account?{" "}
          <button
            className="font-medium text-brand-600 hover:text-brand-700"
            onClick={() => navigate("/")}
          >
            Login
          </button>
        </p>
      </div>
    </SharedLayout>
  );
}
