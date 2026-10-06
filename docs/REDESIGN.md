# Astrofeet: redesign claro e editorial

O visual escuro, neon e "espacial" deu lugar a uma loja clara, editorial e comercial (referências: Nike, END., Kith).
O tema espacial também saiu dos textos. Ficou só o nome **Astrofeet**.

Capturas feitas com o mesmo script, o mesmo banco de dados e a mesma resolução (1440×900 no desktop e 390×844 no mobile).
O "antes" é a `main` no momento do redesign.

## Antes e depois

| Tela | Antes | Depois |
|---|---|---|
| Home (primeira dobra) | ![](redesign/before/01-home-desktop.jpg) | ![](redesign/after/01-home-desktop.jpg) |
| Home (página inteira) | ![](redesign/before/02-home-desktop-full.jpg) | ![](redesign/after/02-home-desktop-full.jpg) |
| Catálogo | ![](redesign/before/03-catalogo-desktop.jpg) | ![](redesign/after/03-catalogo-desktop.jpg) |
| Produto | ![](redesign/before/04-produto-desktop.jpg) | ![](redesign/after/04-produto-desktop.jpg) |
| Carrinho | ![](redesign/before/05-carrinho-desktop.jpg) | ![](redesign/after/05-carrinho-desktop.jpg) |
| Checkout | ![](redesign/before/06-checkout-desktop.jpg) | ![](redesign/after/06-checkout-desktop.jpg) |
| Login | ![](redesign/before/07-login-desktop.jpg) | ![](redesign/after/07-login-desktop.jpg) |
| Painel admin | ![](redesign/before/08-admin-desktop.jpg) | ![](redesign/after/08-admin-desktop.jpg) |
| Minha conta | ![](redesign/before/14-conta-desktop.jpg) | ![](redesign/after/14-conta-desktop.jpg) |
| Rastreio | ![](redesign/before/12-rastreio-desktop.jpg) | ![](redesign/after/12-rastreio-desktop.jpg) |
| Quem somos | ![](redesign/before/13-quem-somos-desktop.jpg) | ![](redesign/after/13-quem-somos-desktop.jpg) |
| Home (mobile) | ![](redesign/before/09-home-mobile.jpg) | ![](redesign/after/09-home-mobile.jpg) |
| Menu (mobile) | ![](redesign/before/10-menu-mobile.jpg) | ![](redesign/after/10-menu-mobile.jpg) |
| Barra de compra (mobile) | ![](redesign/before/11-barra-compra-mobile.jpg) | ![](redesign/after/11-barra-compra-mobile.jpg) |

## Nova identidade

| Token | Valor | Uso |
|---|---|---|
| `--background` | `#ffffff` | fundo |
| `--foreground` / `--ink` | `#111111` | texto, botões secundários, rodapé, faixa de benefícios |
| `--brand` | `#cc3d0a` | **único acento**: CTA principal ("Comprar agora", "Adicionar ao carrinho", "Finalizar compra"), links de destaque |
| `--surface` | `#f4f4f2` | fundo de fotos e blocos |
| `--muted-foreground` | `#5c5c5c` | textos secundários |
| `--hot` | `#c8102e` | favoritos e selo "Edição limitada" |
| `--success` | `#15803d` | frete grátis, em estoque |

Os contrastes atendem o nível WCAG AA: texto branco sobre o laranja dá 4,95:1, o cinza secundário 6,6:1 e o verde 5,0:1.
Os tokens ficam em `src/app/globals.css` e também existem como utilitários Tailwind (`bg-brand`, `text-ink`, `bg-surface`…).

## O que mudou

- **Header:** faixa preta de benefícios (frete, parcelamento, troca), logotipo só em texto e navegação por categoria
  (Lançamentos, Todos os tênis, Corrida, Casual, Skate, Mais vendidos).
- **Home:** hero editorial com título grande e foto em destaque, "Compre por categoria" com fotos, Lançamentos, uma faixa
  preta de oferta com os cupons, Edições limitadas, Mais vendidos e newsletter.
- **Cards de produto:** foto em bloco, sem borda nem brilho. As ações rápidas (adicionar, ver, comparar) aparecem no hover.
  Nome, categoria e marca, preço e parcelamento ficam embaixo.
- **Removidos:** fundo de galáxia, gradientes neon, brilhos e "glows" (28 elementos), órbitas animadas, a lua e o sol do
  login, e os textos em gradiente.
- **Telas internas** (checkout, conta, admin, rastreio, institucional, modais): migradas de forma sistemática.
  Os translúcidos brancos viraram cinzas, os gradientes viraram cor sólida e as cores de status foram escurecidas para
  ficarem legíveis no fundo branco.
- **Textos:** "drops em órbita", "Painel do Comando", "Nave", "pontos estelares" e "Bem-vindo à órbita" viraram linguagem de
  loja ("Lançamentos", "Painel administrativo", "Assistente", "pontos"). Isso inclui os e-mails, o prompt do assistente
  de IA e os dados de exemplo.

## Pendências fora do código

- **Fotos dos produtos:** são imagens geradas com fundo espacial e com o nome escrito na própria foto. Para o visual
  editorial ficar completo, o ideal são fotos de estúdio em fundo claro (`#f4f4f2`), sem texto. Basta trocar os arquivos
  em `public/products/` (ou cadastrar pelo admin).
- **Cupons existentes:** `GALAXIA10`, `ORBITA50` e `DROP15` continuam valendo. Os códigos são dados do banco e mudá-los
  quebraria cupons já divulgados. Para trocar, crie novos pelo painel e desative os antigos.
- **Bancos já criados:** guardam os nomes e descrições antigos (ex.: "Comando Astrofeet"). Só um banco novo usa os novos
  textos de exemplo.
