import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { OdontoSymbol } from "@/components/OdontoSymbol";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

const loginSchema = z.object({
  email: z.string().email("E-mail inválido").max(255),
  senha: z.string().min(6, "Senha deve ter no mínimo 6 caracteres").max(72),
});

const signupSchema = loginSchema.extend({
  nome: z.string().trim().min(2, "Informe seu nome").max(120),
  role: z.enum(["aluno", "professor_admin"]),
});

function LoginPage() {
  const navigate = useNavigate();
  const { session, isPasswordRecovery } = useAuth();
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  if (session && !isPasswordRecovery) {
    navigate({ to: "/inicio" });
  }

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = loginSchema.safeParse({
      email: fd.get("email"),
      senha: fd.get("senha"),
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.senha,
    });
    setLoading(false);
    if (error) {
      toast.error("Usuário ou senha inválidos. Tente novamente.");
      return;
    }
    toast.success("Login realizado com sucesso");
    navigate({ to: "/inicio" });
  };

  const handleSignup = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = signupSchema.safeParse({
      nome: fd.get("nome"),
      email: fd.get("email"),
      senha: fd.get("senha"),
      role: fd.get("role"),
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.senha,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { nome: parsed.data.nome, role: parsed.data.role },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Conta criada! Você já pode entrar.");
    navigate({ to: "/inicio" });
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
      <Card className="w-full max-w-md relative z-10 shadow-2xl border-sky-200/60 bg-white/95 backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 p-3 rounded-full bg-sky-100 w-fit">
            <OdontoSymbol className="h-8 w-8 text-sky-700" />
          </div>
          <CardTitle className="text-2xl text-slate-800">Prontuário Odontológico Digital</CardTitle>
          <CardDescription className="text-slate-500">Acesse o sistema com suas credenciais</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Cadastrar</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">E-mail</Label>
                  <Input id="login-email" name="email" type="email" required autoComplete="email" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="login-senha">Senha</Label>
                    <button
                      type="button"
                      onClick={() => navigate({ to: "/esqueci-senha" })}
                      className="text-xs text-primary hover:underline"
                    >
                      Esqueci minha senha
                    </button>
                  </div>
                  <Input id="login-senha" name="senha" type="password" required autoComplete="current-password" />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Entrando..." : "Entrar"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-nome">Nome completo</Label>
                  <Input id="signup-nome" name="nome" required maxLength={120} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">E-mail</Label>
                  <Input id="signup-email" name="email" type="email" required autoComplete="email" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-senha">Senha</Label>
                  <Input id="signup-senha" name="senha" type="password" required minLength={6} autoComplete="new-password" />
                </div>
                <div className="space-y-2">
                  <Label>Perfil</Label>
                  <RadioGroup name="role" defaultValue="aluno" className="grid grid-cols-1 gap-2">
                    <label className="flex items-center gap-3 rounded-md border p-3 cursor-pointer hover:bg-accent">
                      <RadioGroupItem value="aluno" id="role-aluno" />
                      <div>
                        <div className="font-medium">Aluno</div>
                        <div className="text-xs text-muted-foreground">Cadastra pacientes, agenda e realiza atendimentos</div>
                      </div>
                    </label>
                    <label className="flex items-center gap-3 rounded-md border p-3 cursor-pointer hover:bg-accent">
                      <RadioGroupItem value="professor_admin" id="role-prof" />
                      <div>
                        <div className="font-medium">Professor / Administrador</div>
                        <div className="text-xs text-muted-foreground">Valida prontuários, gera relatórios, gerencia materiais e usuários</div>
                      </div>
                    </label>
                  </RadioGroup>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Cadastrando..." : "Criar conta"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
