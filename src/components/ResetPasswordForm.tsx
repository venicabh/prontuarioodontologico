import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { clearPasswordRecoverySession, hasPasswordRecoverySession, isPasswordRecoveryUrl } from "@/hooks/use-auth";

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
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Redefinir senha</CardTitle>
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
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Salvando..." : "Redefinir senha"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}