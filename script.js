const pages = [...document.querySelectorAll('.page')];
const navButtons = [...document.querySelectorAll('[data-page], [data-go]')];

function showPage(name) {
  const target = document.getElementById(`page-${name}`);
  if (!target) return;
  pages.forEach(page => page.classList.toggle('active', page === target));
  document.querySelectorAll('.nav-link, .mobile-nav-item').forEach(button => {
    button.classList.toggle('active', button.dataset.page === name);
  });
  document.querySelectorAll('.footer-links button').forEach(button => {
    button.classList.toggle('active', button.dataset.page === name);
  });
  const menu = document.getElementById('menu-toggle');
  if (menu) menu.setAttribute('aria-label', 'Open navigation');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

navButtons.forEach(button => {
  button.addEventListener('click', () => {
    const name = button.dataset.page || button.dataset.go;
    if (name) showPage(name);
  });
});

document.getElementById('search-toggle')?.addEventListener('click', () => {
  const panel = document.getElementById('search-panel');
  panel.hidden = !panel.hidden;
  if (!panel.hidden) panel.querySelector('input')?.focus();
});

document.getElementById('menu-toggle')?.addEventListener('click', () => {
  // On small screens, show the navigation list as a simple overlay panel.
  let overlay = document.getElementById('mobile-menu-panel');
  if (overlay) {
    overlay.remove();
    return;
  }
  overlay = document.createElement('div');
  overlay.id = 'mobile-menu-panel';
  overlay.className = 'mobile-menu-panel';
  overlay.innerHTML = `
    <button data-page="home">Home</button>
    <button data-page="articles">Articles</button>
    <button data-page="categories">Categories</button>
    <button data-page="quests">Quests</button>
    <button data-page="community">Community</button>
    <button data-page="profile">Profile</button>`;
  document.querySelector('.site-shell').appendChild(overlay);
  overlay.querySelectorAll('button').forEach(button => button.addEventListener('click', () => {
    showPage(button.dataset.page);
    overlay.remove();
  }));
});

// Demo-only tab states for the category filters and community tabs.
document.querySelectorAll('.filter-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('.filter-chip').forEach(item => item.classList.remove('selected'));
    chip.classList.add('selected');
  });
});
document.querySelectorAll('.segmented button').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.segmented button').forEach(item => item.classList.remove('selected'));
    tab.classList.add('selected');
  });
});
