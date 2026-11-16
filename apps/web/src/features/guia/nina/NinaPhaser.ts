// Renderização da Nina em camadas com Phaser (carregado SOB DEMANDA: só quando existe arte em camadas).
// Uma única instância do Phaser por vez. Sem arte de tronco separado não há "respiração" (manifesto.respiracao = false).
import type { EstadoNina } from "../tutorial/tipos";
import { bocaDaFala, intervaloPiscar, resolverEstado, type Camadas, type Manifesto, type Resolvida } from "./animacao";

export type ControleNina = {
  definirEstado(e: EstadoNina): void;
  definirFalando(f: boolean): void;
  destruir(): void;
};
type Opts = { largura: number; altura: number; reduzirMovimento: boolean; avisar?: (m: string) => void };

let atual: ControleNina | null = null; // garante uma instância só

export async function criarNinaPhaser(el: HTMLElement, m: Manifesto, o: Opts): Promise<ControleNina> {
  atual?.destruir();
  const Phaser = (await import("phaser")).default;
  const esc = o.altura / m.base.altura;
  const chave = (g: string, n: string) => `${g}/${n}`;

  class Cena extends Phaser.Scene {
    estado: EstadoNina = "idle"; falando = false; piscando = false; tick = 0; leve = false;
    pose?: Phaser.GameObjects.Image; olhos?: Phaser.GameObjects.Image; sobr?: Phaser.GameObjects.Image; boca?: Phaser.GameObjects.Image;
    extras: Phaser.GameObjects.Image[] = [];
    constructor() { super("nina"); }

    preload() {
      for (const g of ["poses", "olhos", "sobrancelhas", "bocas", "extras"] as const)
        for (const [n, e] of Object.entries(m[g])) if (e.existe) this.load.image(chave(g, n), m.pasta + e.arquivo);
    }
    create() {
      this.pose = this.add.image(0, 0, "__DEFAULT").setOrigin(0, 0).setScale(esc);
      this.olhos = this.add.image(0, 0, "__DEFAULT").setOrigin(0.5);
      this.sobr = this.add.image(0, 0, "__DEFAULT").setOrigin(0.5);
      this.boca = this.add.image(0, 0, "__DEFAULT").setOrigin(0.5);
      this.aplicar();
      if (!o.reduzirMovimento) {
        this.agendarPiscada();
        if (m.respiracao) {
          this.pose.setOrigin(0.5, 1).setPosition(o.largura / 2, o.altura);
          this.tweens.add({ targets: this.pose, scaleY: esc * 1.006, duration: 2200, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
        }
      }
      // fala: alterna as bocas enquanto "falando"
      this.time.addEvent({ delay: 140, loop: true, callback: () => { if (this.falando) { this.tick++; this.aplicar(); } } });
      // máquina fraca: desliga efeitos
      this.time.addEvent({ delay: 3000, loop: true, callback: () => { const f = this.game.loop.actualFps; if (f > 0 && f < 25 && !this.leve) { this.leve = true; this.aplicar(); } } });
    }
    agendarPiscada() {
      this.time.delayedCall(intervaloPiscar(), () => { this.piscando = true; this.aplicar(); this.time.delayedCall(120, () => { this.piscando = false; this.aplicar(); this.agendarPiscada(); }); });
    }
    usar(img: Phaser.GameObjects.Image | undefined, r: Resolvida, x?: number, y?: number, s = esc) {
      if (!img) return;
      if (!r) { img.setVisible(false); return; }
      img.setTexture(chave(r.grupo, r.nome)).setVisible(true).setScale(s);
      if (x !== undefined && y !== undefined) img.setPosition(x, y);
    }
    aplicar() {
      const c: Camadas = resolverEstado(m, this.estado, { piscando: this.piscando, bocaFala: this.falando ? bocaDaFala(this.tick) : null, avisar: o.avisar });
      if (c.pose) this.pose?.setTexture(chave(c.pose.grupo, c.pose.nome)).setVisible(true); else this.pose?.setVisible(false);
      const rosto = c.pose?.entrada.rosto ?? { x: m.base.largura / 2, y: m.base.altura * 0.25, escala: 1 };
      const rx = rosto.x * esc, ry = rosto.y * esc, rs = esc * rosto.escala;
      this.usar(this.olhos, c.olhos, rx, ry, rs); this.usar(this.sobr, c.sobr, rx, ry, rs); this.usar(this.boca, c.boca, rx, ry, rs);
      for (const x of this.extras) x.destroy();
      this.extras = this.leve || o.reduzirMovimento ? [] : c.extras.map((e) => this.add.image(0, 0, chave(e.grupo, e.nome)).setOrigin(0, 0).setScale(esc));
    }
  }

  const jogo = new Phaser.Game({
    type: Phaser.AUTO, parent: el, width: o.largura, height: o.altura, transparent: true, banner: false, audio: { noAudio: true },
    scale: { mode: Phaser.Scale.NONE }, scene: Cena, fps: { target: 30 }, // 30 fps bastam para uma personagem de interface e poupam bateria
  });
  const pausar = () => (document.hidden ? jogo.loop.sleep() : jogo.loop.wake());
  document.addEventListener("visibilitychange", pausar);
  const cena = () => jogo.scene.getScene("nina") as Cena | undefined;

  const ctrl: ControleNina = {
    definirEstado(e) { const c = cena(); if (c) { c.estado = e; if (c.pose) c.aplicar(); } },
    definirFalando(f) { const c = cena(); if (c) { c.falando = f; if (c.pose) c.aplicar(); } },
    destruir() { document.removeEventListener("visibilitychange", pausar); jogo.destroy(true); if (atual === ctrl) atual = null; },
  };
  atual = ctrl;
  return ctrl;
}
