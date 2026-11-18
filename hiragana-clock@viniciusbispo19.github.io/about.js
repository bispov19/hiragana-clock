// SPDX-License-Identifier: GPL-2.0-or-later
// SPDX-FileCopyrightText: 2026 Vinicius Bispo

// about.js — a aba "Sobre mim" da janela de preferências.
//
// Por que um arquivo separado? O prefs.js cuida das OPÇÕES; esta aba é só
// apresentação (textos, links, créditos). Separar deixa cada arquivo com
// uma responsabilidade e o prefs.js curto. Como o prefs.js, este módulo roda
// no processo de preferências: GTK 4 + libadwaita, nada de St/Clutter/Main.
//
// Ao empacotar, lembre de incluir este arquivo:
//   gnome-extensions pack --extra-source=hiragana.js --extra-source=about.js

import Adw from 'gi://Adw';
import GLib from 'gi://GLib';
import Gtk from 'gi://Gtk';
import Pango from 'gi://Pango';

// hiragana.js não depende do GNOME, então serve tanto para o Shell quanto
// para esta janela: a colinha usa as MESMAS tabelas que o widget.
import * as Hiragana from './hiragana.js';

// ===========================================================================
// Autor: só nome e perfil do GitHub.
// ===========================================================================
const AUTHOR = {
    name: 'Vinicius Bispo',
    githubUser: 'viniciusbispo19',
};

// O kanji de cada dia da semana é um "elemento" (a mesma ordem de
// Date.getDay(): domingo = 0). É daí que vêm os nomes dos dias em japonês.
const ELEMENTS = ['sol', 'lua', 'fogo', 'água', 'madeira', 'metal (ouro)', 'terra'];

// ===========================================================================
// Construção da página
// ===========================================================================

export function buildAboutPage({metadata, window}) {
    const page = new Adw.PreferencesPage({
        title: 'Sobre mim',
        icon_name: 'help-about-symbolic',
    });

    page.add(headerGroup(metadata));
    page.add(extensionGroup(metadata, window));
    page.add(authorGroup(window));
    page.add(weekdayCheatSheetGroup());
    page.add(creditsGroup(metadata, window));
    return page;
}

// --- Cabeçalho: とけい grande na fonte de pincel ---------------------------

function headerGroup(metadata) {
    const group = new Adw.PreferencesGroup();

    // Um PreferencesGroup aceita qualquer widget, não só linhas: aqui uma
    // caixa vertical centralizada com rótulos, como um "cartão de visita".
    const box = new Gtk.Box({
        orientation: Gtk.Orientation.VERTICAL,
        spacing: 6,
        halign: Gtk.Align.CENTER,
        margin_top: 12,
        margin_bottom: 12,
    });

    // とけい (時計) = "relógio". Pango.AttrList aplica a fonte só neste rótulo,
    // a mesma Yuji Syuku do widget (se não estiver instalada, o GTK usa outra).
    const logo = new Gtk.Label({label: 'とけい'});
    logo.set_attributes(Pango.AttrList.from_string('0 -1 font-desc "Yuji Syuku 56"'));
    box.append(logo);

    // Classes de estilo prontas da libadwaita: title-1 (título grande),
    // dim-label (texto mais apagado), caption (texto pequeno).
    box.append(new Gtk.Label({label: 'とけい (時計) quer dizer "relógio"', css_classes: ['caption', 'dim-label']}));
    box.append(new Gtk.Label({label: metadata.name ?? 'Hiragana Clock', css_classes: ['title-1']}));

    const version = metadata['version-name'] ?? metadata.version;
    if (version)
        box.append(new Gtk.Label({label: `Versão ${version}`, css_classes: ['dim-label']}));

    box.append(new Gtk.Label({
        label: 'Um widget para a área de trabalho que mostra o dia da semana em ' +
            'hiragana, para aprender um pouquinho de japonês toda vez que você ' +
            'olha para a tela.',
        wrap: true,
        justify: Gtk.Justification.CENTER,
        max_width_chars: 50,
    }));

    group.add(box);
    return group;
}

// --- A extensão --------------------------------------------------------------

function extensionGroup(metadata, window) {
    const group = new Adw.PreferencesGroup({title: 'A extensão'});

    group.add(new Adw.ActionRow({
        title: 'O que ela faz',
        subtitle: 'Dia da semana em hiragana com degradê prateado, data em ' +
            'português, kanji e hora opcionais. Arraste o widget para onde ' +
            'quiser; clique com o botão direito para abrir estas preferências.',
    }));
    group.add(new Adw.ActionRow({
        title: 'Feita com',
        subtitle: 'JavaScript (GJS), GNOME Shell 50/51, Clutter, St e libadwaita',
    }));
    group.add(new Adw.ActionRow({
        title: 'Testada',
        subtitle: 'Todas as leituras de dias (1 a 31), horas e minutos são ' +
            'conferidas por testes automáticos, porque o japonês tem muitas ' +
            'exceções: ついたち, はつか, よじ, いっぷん…',
    }));

    if (metadata.url) {
        group.add(linkRow(window, 'Código-fonte', 'Veja, estude e contribua no GitHub', metadata.url));
        group.add(linkRow(window, 'Relatar um problema', 'Encontrou um bug ou tem uma ideia? Abra uma issue',
            `${metadata.url}/issues`));
    }
    return group;
}

// --- Sobre mim -------------------------------------------------------------

function authorGroup(window) {
    const group = new Adw.PreferencesGroup({title: 'Sobre mim'});

    // Adw.Avatar mostra as iniciais do nome num círculo colorido (a cor é
    // escolhida a partir do texto, então é sempre a mesma para o mesmo nome).
    const avatarRow = new Adw.ActionRow({title: AUTHOR.name});
    avatarRow.add_prefix(new Adw.Avatar({text: AUTHOR.name, show_initials: true, size: 48}));
    group.add(avatarRow);

    group.add(linkRow(window, 'GitHub', `@${AUTHOR.githubUser}`,
        `https://github.com/${AUTHOR.githubUser}`));
    return group;
}

// --- Colinha dos dias da semana ------------------------------------------------

function weekdayCheatSheetGroup() {
    const group = new Adw.PreferencesGroup({
        title: 'Colinha: os dias da semana',
        description: 'Cada dia tem o nome de um elemento. O de hoje está marcado.',
    });

    // GLib.DateTime: 1 = segunda … 7 = domingo; % 7 deixa o domingo em 0,
    // igual à ordem das tabelas do hiragana.js.
    const today = GLib.DateTime.new_now_local().get_day_of_week() % 7;

    // Começamos na segunda (1) e terminamos no domingo (0), como no
    // calendário japonês de trabalho; (i + 1) % 7 faz essa "volta".
    for (let i = 0; i < 7; i++) {
        const day = (i + 1) % 7;
        const row = new Adw.ActionRow({
            title: Hiragana.WEEKDAYS[day],
            subtitle: `${Hiragana.KANJI_WEEKDAYS[day]}曜日 · ${Hiragana.PT_WEEKDAYS[day]} · ${ELEMENTS[day]}`,
        });

        // O kanji do elemento, grande, à esquerda da linha.
        row.add_prefix(new Gtk.Label({
            label: Hiragana.KANJI_WEEKDAYS[day],
            css_classes: ['title-2'],
            width_chars: 2,
        }));

        if (day === today) {
            // 'accent' pinta o texto com a cor de destaque do sistema.
            row.add_suffix(new Gtk.Label({label: 'hoje', css_classes: ['accent', 'heading']}));
        }
        group.add(row);
    }
    return group;
}

// --- Créditos ------------------------------------------------------------------

function creditsGroup(metadata, window) {
    const group = new Adw.PreferencesGroup({title: 'Créditos'});

    group.add(new Adw.ActionRow({
        title: 'Inspiração',
        subtitle: 'Hiragana Calendar, de zayronXIO, para o KDE Plasma. Daqui veio ' +
            'só a ideia: o código desta extensão foi escrito do zero.',
    }));
    group.add(linkRow(window, 'Fonte Yuji Syuku',
        'The Yuji Project Authors (Kinuta Font Factory) · SIL Open Font License',
        'https://fonts.google.com/specimen/Yuji+Syuku'));
    group.add(linkRow(window, 'Fonte League Gothic',
        'The League Gothic Project Authors (The League of Moveable Type) · SIL Open Font License',
        'https://fonts.google.com/specimen/League+Gothic'));
    if (metadata.url) {
        group.add(linkRow(window, 'Licença', 'GPL-2.0-or-later, a mesma do GNOME Shell',
            `${metadata.url}/blob/main/LICENSE`));
    }
    return group;
}

// --- Ajudante: linha que abre um link no navegador ----------------------------
//
// Gtk.UriLauncher (GTK 4.10+) é o jeito moderno de abrir links: ele pede
// ao sistema (via portal) para abrir no navegador padrão. launch() é
// assíncrono; o callback só verifica se deu certo.
function linkRow(window, title, subtitle, uri) {
    const row = new Adw.ActionRow({title, subtitle, activatable: true});
    row.add_suffix(new Gtk.Image({icon_name: 'adw-external-link-symbolic'}));
    row.connect('activated', () => {
        new Gtk.UriLauncher({uri}).launch(window, null, (launcher, result) => {
            try {
                launcher.launch_finish(result);
            } catch (e) {
                console.error(`Hiragana Clock: não consegui abrir ${uri}: ${e.message}`);
            }
        });
    });
    return row;
}
