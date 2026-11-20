/* =========================================================
   DESIGN THEMES — 切り替えの処理（テーマのサイトから各ページが読み込む）
   正本: 00_master/80_開発室/projects/design-themes/site/themes.js
   テーマ一覧（LIST 区間）は build-themes.py が themes/*.json から組み立てるので、手で書かない。

   ページ側の読み込み方（<head> の中、ページの <style> より前。sync-themes.py が書く）:
     <link rel="stylesheet" href="https://.../themes.css">
     <script src="https://.../themes.js"></script>
   - 同期で読むので、描画前に data-theme が決まり、ちらつかない
   - themes.css の後に置くこと。CSS が読めたこと（--themes-loaded）を確かめてから data-theme を付ける
   - どちらかが読めなければ何もしない。ページは土台（SAI v2、各ページの :root）のまま読める
   ページ側は <div data-theme-switch></div> を1つ置くだけでよい。
   ページ固有の後処理が要る場合は window.onThemeChange に関数を入れる。
   ========================================================= */

/* THEMES:LIST:START */
var THEMES = [
  { id: "mint", name: "Mint", desc: "白と淡いミント・緑のアクセント・黄色のマーカー", dots: ["#2F8B73", "#F2C94C", "#EEF7F3"] },
  { id: "bold", name: "Bold Yellow", desc: "黒と黄・2pxの枠線・影なし", dots: ["#1B1B1B", "#E3E143", "#FAF9EC"] },
  { id: "sai", name: "SAI v2", desc: "モノクロ基調・エディトリアル", dots: ["#62B8A0", "#EB6584", "#F2C94C"] }
];
var THEME_BASE = "sai";     /* 土台（data-theme を付けない）*/
var THEME_INITIAL = "mint";  /* 保存された選択がないときのテーマ */
/* THEMES:LIST:END */

var THEME_KEY = 'design-theme';
var THEME_ICON =
  '<svg viewBox="0 0 24 24" aria-hidden="true">' +
  '<path d="M12 22a1 1 0 0 1 0-20 10 9 0 0 1 10 9 5 5 0 0 1-5 5h-2.25a1.75 1.75 0 0 0-1.4 2.8l.3.4a1.75 1.75 0 0 1-1.4 2.8z"/>' +
  '<circle data-dot cx="13.5" cy="6.5" r="1.5"/><circle data-dot cx="17.5" cy="10.5" r="1.5"/>' +
  '<circle data-dot cx="6.5" cy="12.5" r="1.5"/><circle data-dot cx="8.5" cy="7.5" r="1.5"/></svg>';

function themeById(id) {
  return THEMES.filter(function (t) { return t.id === id; })[0] || null;
}

function savedThemeId() {
  var saved = null;
  try { saved = localStorage.getItem(THEME_KEY); } catch (e) {}
  /* 消したテーマが保存されていたら、最初のテーマに戻す */
  return themeById(saved) ? saved : THEME_INITIAL;
}

/* themes.css が効いているか（読めなかったときは切り替えを出さない） */
var THEMES_READY = (function () {
  try {
    return getComputedStyle(document.documentElement).getPropertyValue('--themes-loaded').trim() === '1';
  } catch (e) { return false; }
})();

var activeTheme = THEMES_READY ? savedThemeId() : THEME_BASE;

/* ---- 描画前に確定させる（<head> で同期に読まれた時点で走る） ---- */
if (THEMES_READY && activeTheme !== THEME_BASE) {
  document.documentElement.setAttribute('data-theme', activeTheme);
}

function themeDotsHTML(theme) {
  return theme.dots.map(function (c) { return '<i style="background:' + c + '"></i>'; }).join('');
}

function applyTheme(id, persist) {
  var theme = themeById(id) || themeById(THEME_INITIAL) || THEMES[0];
  activeTheme = theme.id;
  if (theme.id === THEME_BASE) {
    document.documentElement.removeAttribute('data-theme');
  } else {
    document.documentElement.setAttribute('data-theme', theme.id);
  }
  if (persist) { try { localStorage.setItem(THEME_KEY, theme.id); } catch (e) {} }
  renderThemeSwitch();
  if (typeof window.onThemeChange === 'function') window.onThemeChange(theme.id);
}

function renderThemeSwitch() {
  var mount = document.querySelector('[data-theme-switch]');
  if (!mount) return;
  var theme = themeById(activeTheme) || THEMES[0];

  if (!mount.querySelector('.ts-btn')) {
    mount.innerHTML =
      '<button type="button" class="ts-btn" aria-haspopup="listbox" aria-expanded="false">' + THEME_ICON + '</button>' +
      '<div class="ts-menu" role="listbox" aria-label="デザイン" hidden></div>';
    mount.querySelector('.ts-btn').addEventListener('click', function (e) {
      e.stopPropagation();
      var menu = mount.querySelector('.ts-menu');
      menu.hidden ? openThemeMenu() : closeThemeMenu();
    });
  }

  var btn = mount.querySelector('.ts-btn');
  btn.setAttribute('aria-label', 'デザインを切り替える（現在: ' + theme.name + '）');
  btn.setAttribute('title', 'デザイン: ' + theme.name);

  var menu = mount.querySelector('.ts-menu');
  menu.innerHTML = '';
  THEMES.forEach(function (t) {
    var opt = document.createElement('button');
    opt.type = 'button';
    opt.className = 'ts-opt';
    opt.setAttribute('role', 'option');
    opt.setAttribute('aria-selected', String(t.id === activeTheme));
    opt.innerHTML =
      '<span class="ts-dots">' + themeDotsHTML(t) + '</span>' +
      '<span class="ts-text"><span class="ts-name">' + t.name + '</span>' +
      '<span class="ts-desc">' + t.desc + '</span></span>' +
      '<span class="ts-check">●</span>';
    opt.addEventListener('click', function () { applyTheme(t.id, true); closeThemeMenu(); });
    menu.appendChild(opt);
  });
}

function openThemeMenu() {
  var mount = document.querySelector('[data-theme-switch]');
  if (!mount) return;
  mount.querySelector('.ts-menu').hidden = false;
  mount.querySelector('.ts-btn').setAttribute('aria-expanded', 'true');
}

function closeThemeMenu() {
  var mount = document.querySelector('[data-theme-switch]');
  if (!mount || !mount.querySelector('.ts-menu')) return;
  mount.querySelector('.ts-menu').hidden = true;
  mount.querySelector('.ts-btn').setAttribute('aria-expanded', 'false');
}

function initThemeSwitch() {
  if (!THEMES_READY) return;
  applyTheme(activeTheme, false);

  document.addEventListener('click', function (e) {
    var mount = document.querySelector('[data-theme-switch]');
    if (mount && !mount.contains(e.target)) closeThemeMenu();
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeThemeMenu(); });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initThemeSwitch);
} else {
  initThemeSwitch();
}
