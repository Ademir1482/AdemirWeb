# TransLog KM — Controle Operacional de Quilometragem de Transportadora

Sistema web operacional desenvolvido exclusivamente com **HTML5**, **CSS3** e **JavaScript puro (Vanilla JS)** para registro, controle e compartilhamento rápido de quilometragem rodada por veículos de transportadora em todo o Brasil.

## Estrutura do Projeto

```text
/transportadora
├── index.html      # Estrutura semântica das 6 telas e modais
├── css/
│   └── style.css   # Identidade visual (Azul-Escuro, Branco e Laranja) e responsividade Mobile-First
├── js/
│   └── app.js      # Lógica CRUD, filtros, relatórios, backup JSON/CSV e integração WhatsApp
└── README.md       # Documentação do sistema
```

## Funcionalidades Principais

1. **Dashboard Operacional**: Indicadores de total de anotações, quilometragem acumulada, veículos cadastrados, KM do dia, atalhos rápidos e últimas anotações.
2. **Cadastro de Veículos**: CRUD completo com validação de placa (padrão antigo e Mercosul), modelo, motorista padrão e código da frota.
3. **Registro de Anotações de Quilometragem**: Preenchimento automático da data atual, placa e motorista ao selecionar o veículo, categorias operacionais e botão direto para salvar e enviar pelo WhatsApp.
4. **Histórico Completo**: Exibição em **cards no celular** e **tabela no computador**, com pesquisa por placa e filtros por veículo, categoria, UF, período e ordenação.
5. **Compartilhamento pelo WhatsApp**: Geração automática de relatório formatado para envio individual, por dia, por veículo ou por período via `https://wa.me/?text=` com `encodeURIComponent()`.
6. **Relatórios e Exportação**: Consolidação de KM por veículo, motorista, categoria e estado, além de exportação em **CSV compatível com Excel**.
7. **Armazenamento Local e Backup**: Persistência via `localStorage` sem necessidade de servidor ou banco de dados, com exportação e importação de backup em `.json`.

## Como Executar

Não requer instalação, servidor ou build. Basta abrir o arquivo `index.html` diretamente em qualquer navegador moderno (Google Chrome, Edge, Firefox, Safari) no computador, tablet ou celular.
