import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { clearPasswordRecoverySession, hasPasswordRecoverySession, isPasswordRecoveryUrl } from "@/hooks/use-auth";
import { OdontoSymbol } from "@/components/OdontoSymbol";

export function ResetPasswordForm() {
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(isPasswordRecoveryUrl() || hasPasswordRecoverySession());

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session && (isPasswordRecoveryUrl() || hasPasswordRecoverySession())) {
        setReady(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const senha = String(fd.get("senha") ?? "");
    const confirma = String(fd.get("confirma") ?? "");
    if (senha.length < 6) return toast.error("Senha deve ter no mínimo 6 caracteres");
    if (senha !== confirma) return toast.error("As senhas não coincidem");

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: senha });
    setLoading(false);
    if (error) return toast.error(error.message);
    clearPasswordRecoverySession();
    toast.success("Senha redefinida com sucesso");
    await supabase.auth.signOut();
    window.location.assign("/login");
  };

  return (
    <div
      className="flex min-h-screen items-center justify-start px-4 md:px-16 relative overflow-hidden"
      style={{
        backgroundColor: "#cfcac4",
        backgroundImage: "url(/dentista-bg.jpg)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <Card className="w-full max-w-md relative z-10 shadow-2xl border-stone-300/60 bg-stone-50/95 backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 p-3 rounded-full bg-stone-200 w-fit">
            <OdontoSymbol className="h-8 w-8" />
          </div>
          <CardTitle className="text-2xl text-slate-800">Redefinir senha</CardTitle>
          <CardDescription>
            {ready ? "Crie uma nova senha para sua conta" : "Validando link..."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {ready && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="senha">Nova senha</Label>
                <Input id="senha" name="senha" type="password" required minLength={6} autoComplete="new-password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirma">Confirmar senha</Label>
                <Input id="confirma" name="confirma" type="password" required minLength={6} autoComplete="new-password" />
              </div>
              <Button type="submit" className="w-full bg-stone-700 hover:bg-stone-800 text-white" disabled={loading}>
                {loading ? "Salvando..." : "Redefinir senha"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}