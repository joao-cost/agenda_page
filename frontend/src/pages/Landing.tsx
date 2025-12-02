import { useState } from "react";
import { Link } from "react-router-dom";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Textarea } from "../components/ui/Textarea";
import { Label } from "../components/ui/Label";
import { contactApi } from "../api/contact";

const services = [
  {
    name: "Lavagem Express",
    description: "Limpeza rápida e eficiente para manter o brilho do seu carro.",
    price: "R$ 60",
    duration: "30 min"
  },
  {
    name: "Lavagem Completa",
    description: "Interior e exterior impecáveis com aplicação de proteção.",
    price: "R$ 120",
    duration: "1h 30"
  },
  {
    name: "Polimento Premium",
    description: "Renovação da pintura com polimento técnico e proteção cerâmica.",
    price: "R$ 280",
    duration: "3h"
  }
];

const highlights = [
  { value: "+1200", label: "Carros transformados" },
  { value: "98%", label: "Clientes satisfeitos" },
  { value: "10 anos", label: "de experiência" }
];

const testimonials = [
  {
    name: "Mariana Lopes",
    role: "Cliente desde 2021",
    message:
      "Serviço impecável! Meu carro sempre sai com cara de zero. Atendimento extremamente profissional."
  },
  {
    name: "Pedro Almeida",
    role: "Empresário",
    message:
      "O cuidado com cada detalhe é impressionante. Recomendo para quem quer um resultado premium."
  }
];

const features = [
  {
    title: "Check-up completo",
    description: "Vistoria 360º com relatório enviado no WhatsApp e fotos de cada etapa."
  },
  {
    title: "Produtos premium",
    description: "Linha importada de proteção e revitalização aprovada para veículos de luxo."
  },
  {
    title: "Agenda inteligente",
    description: "Sistema que evita conflitos e garante seu horário preferido em minutos."
  }
];

const processSteps = [
  {
    title: "1. Diagnóstico especializado",
    description: "Identificamos os pontos críticos do seu veículo e sugerimos o pacote ideal."
  },
  {
    title: "2. Execução impecável",
    description: "Equipe certificada cuida de cada detalhe com equipamentos de última geração."
  },
  {
    title: "3. Entrega com briefing",
    description: "Você recebe orientações de manutenção e acompanha tudo pelo app/WhatsApp."
  }
];

import washingImg from "../assets/images/washing.png";
import interiorImg from "../assets/images/interior_detail.png";
import polishingImg from "../assets/images/polishing.png";

const gallery = [
  {
    src: washingImg,
    alt: "Lavagem detalhada"
  },
  {
    src: interiorImg,
    alt: "Interior higienizado"
  },
  {
    src: polishingImg,
    alt: "Polimento profissional"
  }
];

export function LandingPage() {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    vehicle: "",
    message: ""
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await contactApi.submit(formData);
      setSuccess(true);
      setFormData({ name: "", phone: "", vehicle: "", message: "" });

      // Reset success message after 5 seconds
      setTimeout(() => setSuccess(false), 5000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Erro ao enviar formulário. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="flex h-full flex-col bg-surface overflow-y-auto">
      <header className="relative overflow-hidden bg-secondary-900 text-surface min-h-[600px] md:min-h-[700px]">
        <div className="absolute inset-0 pt-16">
          <div className="absolute inset-0 bg-gradient-to-br from-secondary-900 via-secondary-800 to-primary opacity-90" />
          <div className="absolute -left-32 top-10 h-72 w-72 rounded-full bg-primary/40 blur-2xl" />
          <div className="absolute -right-20 bottom-0 h-96 w-96 rounded-full bg-secondary-800/60 blur-3xl" />
          <img
            src="https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1800&q=80"
            alt="Carro esportivo polido"
            className="h-full w-full object-cover opacity-20 mix-blend-overlay"
          />
        </div>

        <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-16 px-6 pt-24 pb-24 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl space-y-6">
            <div className="flex flex-col gap-4">
              <div className="text-5xl font-bold text-surface">Detail Prime</div>
              <Badge variant="secondary" className="bg-primary/20 text-primary-700 w-fit font-medium">
                estética automotiva premium
              </Badge>
            </div>
            <h1 className="text-4xl font-semibold leading-tight md:text-5xl">
              Mais que lavagem: uma experiência de detailing de outro nível
            </h1>
            <p className="text-lg text-surface/80">
              Seja para preparar o carro para um evento, revitalizar a pintura ou manter a frota impecável,
              nossa equipe entrega resultados de showroom com tecnologia, transparência e velocidade.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Button asChild className="shadow-lg shadow-secondary-900/30">
                <Link to="/agendar">Agendar agora</Link>
              </Button>
              <Button variant="secondary" asChild>
                <Link to="#experiencia">Ver como funciona</Link>
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-4 text-sm text-surface/80 sm:grid-cols-3">
              {highlights.map((item) => (
                <div key={item.label} className="rounded-xl border border-surface/10 bg-white/10 p-4 backdrop-blur">
                  <span className="text-2xl font-semibold text-surface">{item.value}</span>
                  <p className="text-xs uppercase tracking-wide text-surface/70">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative flex w-full max-w-sm flex-col gap-6 rounded-3xl border border-white/10 bg-white/10 p-6 text-surface backdrop-blur-lg shadow-2xl">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-surface/60">Experiência</p>
              <h2 className="mt-2 text-2xl font-semibold">Pacote Diamond</h2>
            </div>
            <p className="text-sm text-surface/80">
              Higienização completa, vitrificação 9H, revitalização dos cromados e finalização com perfume assinatura.
            </p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-2xl border border-white/10 bg-white/10 p-3">
                <p className="text-xs uppercase text-surface/60">Duração</p>
                <p className="text-lg font-semibold">4h</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 p-3">
                <p className="text-xs uppercase text-surface/60">Investimento</p>
                <p className="text-lg font-semibold">R$ 480</p>
              </div>
            </div>
            <Button variant="secondary" asChild className="w-full border border-white/30 bg-white/10">
              <Link to="/agendar">Quero esse resultado</Link>
            </Button>
            <p className="text-xs text-surface/70">
              + Envio de relatório com antes/depois • Retirada e entrega no endereço • Notificações em tempo real
            </p>
          </div>
        </div>
      </header>

      <main className="flex flex-col gap-0 pb-0">
        {/* Seção Sobre */}
        <section id="sobre" className="relative overflow-hidden bg-gradient-to-b from-surface via-white to-primary/5 py-24">
          <div className="absolute inset-0">
            <div className="absolute right-0 top-20 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
            <div className="absolute left-0 bottom-20 h-80 w-80 rounded-full bg-accent/10 blur-3xl" />
          </div>
          <div className="relative mx-auto w-full max-w-6xl px-6">
            <div className="grid gap-16 md:grid-cols-[1.1fr_0.9fr] md:items-center">
              <div className="space-y-8">
                <Badge variant="secondary" className="bg-gradient-to-r from-primary/20 to-primary/10 text-primary-500 border-primary/30 font-medium">
                  Sobre nós
                </Badge>
                <h2 className="text-4xl font-bold leading-tight text-secondary-900 md:text-5xl">
                  Cuidado artesanal com tecnologia para resultados{" "}
                  <span className="bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent font-extrabold">
                    dignos de vitrine
                  </span>
                </h2>
                <p className="text-lg leading-relaxed text-secondary-700">
                  Desde 2013 transformamos veículos com protocolos exclusivos, monitoramento em tempo real
                  e produtos homologados pelas principais montadoras. O resultado é brilho extremo, proteção
                  duradoura e uma experiência de atendimento que fideliza.
                </p>
                <div className="grid gap-4 md:grid-cols-3">
                  {features.map((feature, idx) => (
                    <div
                      key={feature.title}
                      className="group relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-white to-primary/5 p-5 shadow-lg shadow-primary/5 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-primary/20"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/0 to-primary/10 opacity-0 transition-opacity group-hover:opacity-100" />
                      <div className="relative">
                        <h3 className="text-base font-bold text-secondary-900">{feature.title}</h3>
                        <p className="mt-2 text-sm leading-relaxed text-secondary-600">{feature.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative flex items-center justify-center">
                <div className="absolute -left-8 -top-8 h-48 w-48 rounded-full bg-gradient-to-br from-primary/30 to-accent/20 blur-3xl" />
                <div className="relative grid grid-cols-2 grid-rows-2 gap-4 h-[500px]">
                  {gallery.map((item, index) => (
                    <figure
                      key={item.alt}
                      className={`group overflow-hidden rounded-3xl shadow-2xl ring-2 ring-primary/20 transition-all duration-500 hover:ring-primary/40 ${index === 0 ? "row-span-2 h-full" : "h-full"
                        }`}
                    >
                      <div className="relative h-full w-full overflow-hidden">
                        <img
                          src={item.src}
                          alt={item.alt}
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-secondary-900/40 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                      </div>
                    </figure>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Seção Experiência */}
        <section id="experiencia" className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-white to-accent/5 py-24">
          <div className="absolute inset-0">
            <div className="absolute left-1/4 top-0 h-64 w-64 rounded-full bg-primary/15 blur-3xl" />
            <div className="absolute right-1/4 bottom-0 h-72 w-72 rounded-full bg-accent/15 blur-3xl" />
          </div>
          <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-16 px-6">
            <div className="mx-auto max-w-3xl space-y-6 text-center">
              <Badge variant="secondary" className="bg-secondary-900 text-accent-200 border border-accent/30 font-bold mx-auto">
                Experiência completa
              </Badge>
              <h2 className="text-4xl font-bold leading-tight text-secondary-900 md:text-5xl">
                Um processo pensado para você{" "}
                <span className="bg-gradient-to-r from-accent-600 to-primary-600 bg-clip-text text-transparent font-extrabold">
                  acompanhar cada etapa
                </span>
              </h2>
              <p className="text-lg leading-relaxed text-secondary-700 mx-auto max-w-2xl">
                Acompanhe seu veículo do diagnóstico à entrega com total transparência via aplicativo ou WhatsApp.
                Nosso time envia notificações automáticas, fotos e orientações para o pós-serviço.
              </p>
              <Button asChild className="shadow-lg shadow-primary/30 mx-auto">
                <Link to="/agendar">Quero viver essa experiência</Link>
              </Button>
            </div>
            <div className="grid w-full gap-6 md:grid-cols-3">
              {processSteps.map((step, idx) => (
                <div
                  key={step.title}
                  className="group relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-white via-primary/5 to-white p-8 shadow-xl shadow-primary/10 transition-all duration-300 hover:-translate-y-3 hover:shadow-2xl hover:shadow-primary/25"
                >
                  <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 blur-2xl opacity-50 transition-opacity group-hover:opacity-100" />
                  <span className="relative z-10 -mt-2 -ml-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-xl font-bold text-white shadow-lg shadow-primary/30">
                    {step.title.split(".")[0]}
                  </span>
                  <h3 className="relative z-10 mt-6 text-lg font-bold text-secondary-900">{step.title.replace(/^\d+\.\s*/, "")}</h3>
                  <p className="relative z-10 mt-3 text-sm leading-relaxed text-secondary-600">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Seção Serviços */}
        <section id="servicos" className="relative overflow-hidden bg-gradient-to-b from-accent/5 via-primary/5 to-surface py-24">
          <div className="absolute inset-0">
            <div className="absolute left-0 top-1/4 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
            <div className="absolute right-0 bottom-1/4 h-80 w-80 rounded-full bg-accent/10 blur-3xl" />
          </div>
          <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-12 px-6">
            <div className="flex flex-col gap-4 text-center">
              <Badge variant="secondary" className="mx-auto bg-gradient-to-r from-primary/20 to-accent/20 text-primary border-primary/30">
                Serviços
              </Badge>
              <h2 className="text-4xl font-bold text-secondary-900 md:text-5xl">
                Portfólio de{" "}
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">cuidados</span>
              </h2>
              <p className="mx-auto max-w-2xl text-lg text-secondary-700">
                Resultados visíveis em minutos e proteção que dura meses, sempre com materiais premium.
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              {services.map((service, idx) => (
                <div
                  key={service.name}
                  className="group relative overflow-hidden rounded-3xl border-2 border-primary/20 bg-gradient-to-br from-white via-primary/5 to-white p-8 shadow-xl shadow-primary/10 transition-all duration-300 hover:-translate-y-3 hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/25"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-primary/5 to-accent/5 opacity-0 transition-opacity group-hover:opacity-100" />
                  <div className="relative z-10">
                    <h3 className="text-2xl font-bold text-secondary-900">{service.name}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-secondary-600">{service.description}</p>
                    <div className="mt-8 flex items-center justify-between border-t border-primary/10 pt-6">
                      <span className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                        {service.price}
                      </span>
                      <span className="rounded-full bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary">
                        {service.duration}
                      </span>
                    </div>
                    <Button asChild className="mt-8 w-full shadow-lg shadow-primary/20">
                      <Link to="/agendar">Agendar agora</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Seção Depoimentos */}
        <section id="depoimentos" className="relative overflow-hidden bg-gradient-to-b from-surface via-white to-primary/5 py-24">
          <div className="absolute inset-0">
            <div className="absolute right-1/4 top-0 h-64 w-64 rounded-full bg-accent/10 blur-3xl" />
          </div>
          <div className="relative mx-auto w-full max-w-6xl px-6">
            <div className="flex flex-col gap-8">
              <div className="text-center">
                <Badge variant="secondary" className="mx-auto bg-gradient-to-r from-accent/20 to-primary/20 text-accent-100 border-accent/30">
                  Depoimentos
                </Badge>
                <h2 className="mt-4 text-4xl font-bold text-secondary-900 md:text-5xl">
                  Clientes que{" "}
                  <span className="bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">confiam</span>{" "}
                  no nosso trabalho
                </h2>
              </div>
              <div className="grid gap-8 md:grid-cols-2">
                {testimonials.map((testimonial, idx) => (
                  <blockquote
                    key={testimonial.name}
                    className="group relative overflow-hidden rounded-3xl border-2 border-primary/20 bg-gradient-to-br from-white to-primary/5 p-8 shadow-xl shadow-primary/10 transition-all duration-300 hover:-translate-y-2 hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/20"
                  >
                    <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-primary/10 blur-3xl opacity-50 transition-opacity group-hover:opacity-100" />
                    <div className="relative z-10">
                      <p className="text-lg leading-relaxed text-secondary-700">"{testimonial.message}"</p>
                      <footer className="mt-6 flex items-center gap-4 border-t border-primary/10 pt-6">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-accent" />
                        <div>
                          <p className="font-bold text-secondary-900">{testimonial.name}</p>
                          <p className="text-sm text-secondary-500">{testimonial.role}</p>
                        </div>
                      </footer>
                    </div>
                  </blockquote>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Seção Contato */}
        <section id="contato" className="relative overflow-hidden bg-gradient-to-b from-secondary-900 via-secondary-800 to-secondary-900 py-24 text-surface">
          <div className="absolute inset-0">
            <div className="absolute left-0 top-0 h-96 w-96 rounded-full bg-primary/20 blur-3xl animate-pulse" />
            <div className="absolute right-0 bottom-0 h-80 w-80 rounded-full bg-accent/20 blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
            <div className="absolute left-1/2 top-1/2 h-64 w-64 rounded-full bg-primary/10 blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />
            <img
              src="https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1800&q=80"
              alt=""
              className="h-full w-full object-cover opacity-10 mix-blend-overlay"
            />
          </div>
          <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 lg:flex-row lg:items-start lg:gap-12">
            {/* Formulário de Contato */}
            <div className="flex-1 space-y-6">
              <div className="space-y-4">
                <Badge variant="secondary" className="bg-surface/20 text-surface border-surface/30 w-fit animate-fade-in">
                  Contato
                </Badge>
                <h2 className="text-4xl font-bold leading-tight md:text-5xl lg:text-6xl">
                  Fale com a gente e descubra o plano{" "}
                  <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-gradient bg-[length:200%_auto]">
                    perfeito
                  </span>{" "}
                  para o seu veículo
                </h2>
                <p className="text-lg leading-relaxed text-surface/90 max-w-2xl">
                  Preencha o formulário abaixo e nossa equipe entrará em contato em breve. Ou fale diretamente pelo WhatsApp.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2 group">
                    <Label htmlFor="name" className="text-surface/90 group-focus-within:text-primary transition-colors">
                      Nome completo *
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => handleChange("name", e.target.value)}
                      placeholder="Seu nome"
                      className="bg-white/10 border-surface/30 text-surface placeholder:text-surface/50 transition-all hover:bg-white/15 hover:border-primary/50 focus:bg-white/15 focus:border-primary"
                    />
                  </div>

                  <div className="space-y-2 group">
                    <Label htmlFor="phone" className="text-surface/90 group-focus-within:text-primary transition-colors">
                      Telefone/WhatsApp *
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => handleChange("phone", e.target.value)}
                      placeholder="(00) 00000-0000"
                      className="bg-white/10 border-surface/30 text-surface placeholder:text-surface/50 transition-all hover:bg-white/15 hover:border-primary/50 focus:bg-white/15 focus:border-primary"
                    />
                  </div>
                </div>

                <div className="space-y-2 group">
                  <Label htmlFor="vehicle" className="text-surface/90 group-focus-within:text-primary transition-colors">
                    Veículo *
                  </Label>
                  <Input
                    id="vehicle"
                    type="text"
                    required
                    value={formData.vehicle}
                    onChange={(e) => handleChange("vehicle", e.target.value)}
                    placeholder="Ex: Honda Civic 2020"
                    className="bg-white/10 border-surface/30 text-surface placeholder:text-surface/50 transition-all hover:bg-white/15 hover:border-primary/50 focus:bg-white/15 focus:border-primary"
                  />
                </div>

                <div className="space-y-2 group">
                  <Label htmlFor="message" className="text-surface/90 group-focus-within:text-primary transition-colors">
                    Mensagem (opcional)
                  </Label>
                  <Textarea
                    id="message"
                    rows={4}
                    value={formData.message}
                    onChange={(e) => handleChange("message", e.target.value)}
                    placeholder="Conte-nos como podemos ajudar..."
                    className="bg-white/10 border-surface/30 text-surface placeholder:text-surface/50 transition-all hover:bg-white/15 hover:border-primary/50 focus:bg-white/15 focus:border-primary resize-none"
                  />
                </div>

                {success && (
                  <div className="rounded-xl bg-gradient-to-r from-green-500/20 to-green-600/20 border border-green-500/30 p-4 text-green-100 animate-fade-in shadow-lg shadow-green-500/20">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">✅</span>
                      <p className="font-medium">Pré-cadastro realizado com sucesso! Aguarde aprovação e entraremos em contato.</p>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="rounded-xl bg-gradient-to-r from-red-500/20 to-red-600/20 border border-red-500/30 p-4 text-red-100 animate-fade-in shadow-lg shadow-red-500/20">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">❌</span>
                      <p className="font-medium">{error}</p>
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-4 sm:flex-row pt-2">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-primary via-accent to-primary text-white shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all hover:scale-[1.02] active:scale-[0.98] bg-[length:200%_auto] animate-gradient"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Enviando...
                      </span>
                    ) : (
                      "✨ Enviar Pré-Cadastro"
                    )}
                  </Button>
                  <Button
                    type="button"
                    asChild
                    className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <a
                      href="https://wa.me/5566992566750?text=Olá!%20Gostaria%20de%20falar%20com%20um%20vendedor%20sobre%20os%20serviços%20da%20DetailPrime."
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      💬 Falar Agora no WhatsApp
                    </a>
                  </Button>
                </div>
              </form>
            </div>

            {/* Card de Agendamento */}
            <div className="flex-1 lg:sticky lg:top-24">
              <div className="group relative rounded-3xl border-2 border-primary/30 bg-gradient-to-br from-white/95 via-white/90 to-primary/10 p-8 text-secondary-900 shadow-2xl shadow-primary/20 backdrop-blur-lg transition-all hover:shadow-3xl hover:shadow-primary/30 hover:-translate-y-1">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary via-accent to-primary rounded-3xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500" />
                <div className="relative">
                  <h3 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-4">
                    PRONTO PARA SURPREENDER?
                  </h3>
                  <div className="mt-6 mb-6 rounded-2xl overflow-hidden shadow-xl ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all">
                    <div className="relative">
                      <img
                        src="https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80"
                        alt="Carro limpo e polido"
                        className="w-full h-56 object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-secondary-900/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                  <p className="text-xl font-bold text-secondary-900 mb-6 leading-tight">
                    NÃO PERCA TEMPO E FAÇA SEU AGENDAMENTO
                  </p>
                  <div className="space-y-4 mb-8">
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-primary/5 hover:bg-primary/10 transition-colors group/item">
                      <span className="text-2xl mt-0.5 group-hover/item:scale-110 transition-transform">📞</span>
                      <div>
                        <p className="font-semibold text-secondary-900">Telefone:</p>
                        <a href="tel:66992566750" className="text-primary hover:text-accent hover:underline transition-colors font-medium">
                          (66) 99256-6750
                        </a>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-primary/5 hover:bg-primary/10 transition-colors group/item">
                      <span className="text-2xl mt-0.5 group-hover/item:scale-110 transition-transform">📍</span>
                      <div>
                        <p className="font-semibold text-secondary-900">Endereço:</p>
                        <p className="text-secondary-700">Av. dos Ingás, Unemat - Jardim Imperial</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-primary/5 hover:bg-primary/10 transition-colors group/item">
                      <span className="text-2xl mt-0.5 group-hover/item:scale-110 transition-transform">⏰</span>
                      <div>
                        <p className="font-semibold text-secondary-900">Horário:</p>
                        <p className="text-secondary-700">Segunda à Sexta 8h às 18h</p>
                      </div>
                    </div>
                  </div>
                  <Button asChild className="w-full shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all hover:scale-[1.02] active:scale-[0.98]">
                    <Link to="/agendar">🚀 Realizar agendamento</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative overflow-hidden bg-gradient-to-b from-secondary-900 via-secondary-800 to-secondary-900 border-t border-primary/20">
        <div className="absolute inset-0">
          <div className="absolute left-0 top-0 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute right-0 bottom-0 h-64 w-64 rounded-full bg-accent/10 blur-3xl" />
        </div>
        <div className="relative mx-auto w-full max-w-6xl px-6 py-12">
          <div className="grid gap-8 md:grid-cols-4">
            {/* Logo e Descrição */}
            <div className="md:col-span-2 space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Detail Prime
                </span>
              </div>
              <p className="text-sm leading-relaxed text-surface/80 max-w-md">
                Estética automotiva premium com tecnologia de ponta e atenção aos detalhes. Transformamos seu veículo em uma obra de arte sobre rodas.
              </p>
              <div className="flex items-center gap-4 pt-2">
                <a
                  href="https://wa.me/5566992566750"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-primary transition hover:bg-primary/30 hover:scale-110"
                  aria-label="WhatsApp"
                >
                  <span className="text-xl">💬</span>
                </a>
                <a
                  href="https://instagram.com/detailprime"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-primary transition hover:bg-primary/30 hover:scale-110"
                  aria-label="Instagram"
                >
                  <span className="text-xl">📷</span>
                </a>
                <a
                  href="https://facebook.com/detailprime"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-primary transition hover:bg-primary/30 hover:scale-110"
                  aria-label="Facebook"
                >
                  <span className="text-xl">👥</span>
                </a>
              </div>
            </div>

            {/* Links Rápidos */}
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-surface">Links Rápidos</h3>
              <nav className="flex flex-col gap-3">
                <Link to="/" className="text-sm text-surface/70 transition hover:text-primary">
                  Início
                </Link>
                <Link to="/agendar" className="text-sm text-surface/70 transition hover:text-primary">
                  Agendar Serviço
                </Link>
                <a href="#sobre" className="text-sm text-surface/70 transition hover:text-primary">
                  Sobre Nós
                </a>
                <a href="#servicos" className="text-sm text-surface/70 transition hover:text-primary">
                  Serviços
                </a>
                <a href="#contato" className="text-sm text-surface/70 transition hover:text-primary">
                  Contato
                </a>
              </nav>
            </div>

            {/* Contato */}
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-surface">Contato</h3>
              <div className="flex flex-col gap-3 text-sm text-surface/70">
                <div className="flex items-start gap-2">
                  <span className="mt-0.5">📞</span>
                  <span>(66) 99256-6750</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="mt-0.5">📍</span>
                  <span>Av. dos Ingás, Unemat<br />Jardim Imperial</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="mt-0.5">⏰</span>
                  <span>Segunda à Sexta<br />8h às 18h</span>
                </div>
              </div>
            </div>
          </div>

          {/* Divisor */}
          <div className="my-8 border-t border-primary/20" />

          {/* Copyright e Créditos */}
          <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:justify-between">
            <p className="text-sm text-surface/60">
              © {new Date().getFullYear()} DetailPrime. Todos os direitos reservados.
            </p>
            <div className="flex flex-col items-center gap-2 sm:flex-row sm:gap-4">
              <p className="text-xs text-surface/50">
                Desenvolvido com ❤️ por{" "}
                <a
                  href="https://hyperdynamis.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-primary transition hover:text-accent"
                >
                  Hyper Dynamis
                </a>
              </p>
              <span className="hidden text-surface/30 sm:inline">•</span>
              <a
                href="#"
                className="text-xs text-surface/50 transition hover:text-primary"
              >
                Política de Privacidade
              </a>
              <span className="hidden text-surface/30 sm:inline">•</span>
              <a
                href="#"
                className="text-xs text-surface/50 transition hover:text-primary"
              >
                Termos de Uso
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

