import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { OdontoSymbol } from "@/components/OdontoSymbol";

export const Route = createFileRoute("/esqueci-senha")({
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const email = String(new FormData(e.currentTarget).get("email") ?? "").trim();
    if (!email) return toast.error("Informe seu e-mail");
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `https://prontuarioodontologico-aokb.vercel.app/?reset-password=1`,
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    setSent(true);
    toast.success("E-mail de recuperação enviado");
  };

  return (
    <div className="flex min-h-screen">
      <div className="flex flex-1 items-center justify-center px-6 py-12 bg-stone-100">
        <Card className="w-full max-w-md shadow-2xl border-stone-300/60 bg-stone-50/95">
          <CardHeader className="text-center">
            <div className="mx-auto mb-3 p-3 rounded-full bg-stone-200 w-fit">
              <OdontoSymbol className="h-8 w-8" />
            </div>
            <CardTitle className="text-2xl text-slate-800">Recuperar senha</CardTitle>
            <CardDescription>
              {sent
                ? "Verifique seu e-mail e clique no link para redefinir a senha"
                : "Informe seu e-mail e enviaremos um link de recuperação"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!sent && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input id="email" name="email" type="email" required autoComplete="email" />
                </div>
                <Button type="submit" className="w-full bg-stone-700 hover:bg-stone-800 text-white" disabled={loading}>
                  {loading ? "Enviando..." : "Enviar link"}
                </Button>
              </form>
            )}
            <div className="mt-4 text-center">
              <Link to="/login" className="text-sm text-primary hover:underline">
                Voltar para o login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="hidden lg:flex w-1/2 items-center justify-center bg-stone-100">
        <img
          src="/dentista-bg.jpg"
          alt=""
          aria-hidden="true"
          className="h-full max-h-screen w-auto object-contain select-none pointer-events-none"
        />
      </div>
    </div>
  );
}
