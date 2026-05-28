import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Printer, MessageCircle, Mail, FileSignature, ExternalLink } from "lucide-react";
import { toast } from "sonner";

type Props = {
  prescricao: string;
  paciente?: {
    nome?: string | null;
    telefone?: string | null;
    email?: string | null;
  } | null;
  alunoNome?: string | null;
  dataAtendimento?: string | null;
};

function buildPlainText(p: Props) {
  const linhas = [
    "PRESCRIÇÃO ODONTOLÓGICA",
    "",
    p.paciente?.nome ? `Paciente: ${p.paciente.nome}` : null,
    p.dataAtendimento
      ? `Data: ${new Date(p.dataAtendimento).toLocaleDateString("pt-BR")}`
      : null,
    "",
    p.prescricao,
    "",
    p.alunoNome ? `Responsável: ${p.alunoNome}` : null,
  ].filter(Boolean);
  return linhas.join("\n");
}

function buildHtml(p: Props) {
  const data = p.dataAtendimento
    ? new Date(p.dataAtendimento).toLocaleDateString("pt-BR")
    : new Date().toLocaleDateString("pt-BR");
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"/>
<title>Prescrição - ${p.paciente?.nome ?? ""}</title>
<style>
  @page { margin: 24mm; }
  body { font-family: Arial, Helvetica, sans-serif; color:#111; line-height:1.5; }
  h1 { font-size: 18pt; margin: 0 0 16px; text-align:center; letter-spacing:1px; }
  .meta { font-size: 11pt; margin-bottom: 24px; border-bottom:1px solid #999; padding-bottom:12px; }
  .meta div { margin: 2px 0; }
  .corpo { white-space: pre-wrap; font-size: 12pt; min-height: 40vh; }
  .assinatura { margin-top: 80px; text-align:center; font-size: 11pt; }
  .linha { border-top:1px solid #111; width: 60%; margin: 0 auto 6px; }
</style></head><body>
<h1>Prescrição Odontológica</h1>
<div class="meta">
  <div><strong>Paciente:</strong> ${p.paciente?.nome ?? "—"}</div>
  <div><strong>Data:</strong> ${data}</div>
</div>
<div class="corpo">${(p.prescricao || "").replace(/[<>]/g, (c) => (c === "<" ? "&lt;" : "&gt;"))}</div>
<div class="assinatura">
  <div class="linha"></div>
  ${p.alunoNome ?? "Cirurgião(ã)-Dentista responsável"}
</div>
<script>window.onload = () => { window.print(); };</script>
</body></html>`;
}

function sanitizePhone(phone?: string | null) {
  if (!phone) return "";
  const d = phone.replace(/\D/g, "");
  // Adiciona DDI Brasil se faltar
  if (d.length === 10 || d.length === 11) return "55" + d;
  return d;
}

export function PrescricaoActions(props: Props) {
  const [assinarOpen, setAssinarOpen] = useState(false);
  const temPrescricao = !!props.prescricao?.trim();

  const imprimir = () => {
    if (!temPrescricao) return toast.error("Não há prescrição para imprimir");
    const w = window.open("", "_blank", "width=800,height=900");
    if (!w) return toast.error("Permita pop-ups para imprimir");
    w.document.open();
    w.document.write(buildHtml(props));
    w.document.close();
  };

  const whatsapp = () => {
    if (!temPrescricao) return toast.error("Não há prescrição para enviar");
    const phone = sanitizePhone(props.paciente?.telefone);
    const texto = encodeURIComponent(buildPlainText(props));
    const url = phone
      ? `https://wa.me/${phone}?text=${texto}`
      : `https://wa.me/?text=${texto}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const email = () => {
    if (!temPrescricao) return toast.error("Não há prescrição para enviar");
    const to = props.paciente?.email ?? "";
    const subject = encodeURIComponent(
      `Prescrição odontológica${props.paciente?.nome ? " - " + props.paciente.nome : ""}`,
    );
    const body = encodeURIComponent(buildPlainText(props));
    window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
  };

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={imprimir}>
          <Printer className="h-4 w-4 mr-1.5" /> Imprimir / Salvar PDF
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={whatsapp}>
          <MessageCircle className="h-4 w-4 mr-1.5" /> WhatsApp
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={email}>
          <Mail className="h-4 w-4 mr-1.5" /> E-mail
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setAssinarOpen(true)}
        >
          <FileSignature className="h-4 w-4 mr-1.5" /> Assinar digitalmente
        </Button>
      </div>

      <Dialog open={assinarOpen} onOpenChange={setAssinarOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assinatura digital da prescrição</DialogTitle>
            <DialogDescription>
              A assinatura digital é feita fora do sistema, usando seu certificado
              ICP-Brasil ou a conta gov.br.
            </DialogDescription>
          </DialogHeader>

          <ol className="space-y-3 text-sm list-decimal pl-5">
            <li>
              Clique em <strong>Imprimir / Salvar PDF</strong> e escolha
              "Salvar como PDF" no destino da impressão.
            </li>
            <li>
              Acesse o <strong>Assinador Digital ITI</strong> (gov.br) e envie o PDF
              para assinar com sua conta gov.br nível Prata ou Ouro, ou com seu
              certificado ICP-Brasil (A1/A3).
            </li>
            <li>
              Baixe o PDF assinado e envie ao paciente por WhatsApp ou e-mail.
            </li>
          </ol>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setAssinarOpen(false);
                setTimeout(imprimir, 50);
              }}
            >
              <Printer className="h-4 w-4 mr-1.5" /> Gerar PDF
            </Button>
            <Button asChild>
              <a
                href="https://assinador.iti.br"
                target="_blank"
                rel="noopener noreferrer"
              >
                Abrir Assinador ITI
                <ExternalLink className="h-4 w-4 ml-1.5" />
              </a>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
