"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@alliya.com");
  const [password, setPassword] = useState("password123");
  const [laboratoryId, setLaboratoryId] = useState("LAB001");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        const { data: userLaboratories, error: labError } = await supabase
          .from("user_laboratories")
          .select("laboratory_id")
          .eq("user_id", data.user.id)
          .single();

        if (labError) throw labError;

        if (userLaboratories?.laboratory_id !== laboratoryId) {
          throw new Error("Vous n'êtes pas autorisé à accéder à ce laboratoire");
        }

        router.push("/dashboard");
      }
    } catch (err) {
      setError("Une erreur est survenue lors de la connexion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-alliya-blue to-alliya-turquoise p-4">
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8">
          <h2 className="text-2xl font-bold text-alliya-blue mb-4">Connexion Alliya Laboratoire</h2>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-6">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-alliya-blue focus:border-transparent"
                placeholder="votre@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mot de passe</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-alliya-blue focus:border-transparent"
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ID Laboratoire</label>
              <input
                type="text"
                value={laboratoryId}
                onChange={(e) => setLaboratoryId(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-alliya-blue focus:border-transparent"
                placeholder="Ex: LAB001"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-alliya-blue text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-alliya-blue focus:ring-offset-2"
            >
              {loading ? "Connexion..." : "Se connecter"}
            </button>
          </form>
          <p className="text-center mt-6 text-sm">
            Pas encore de compte ? <a href="/register" className="text-alliya-blue hover:text-blue-700">S'inscrire</a>
          </p>
        </div>
      </div>
    </div>
  );
}