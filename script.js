(() => {
  'use strict';
  const config = window.SALON_CONFIG || {};
  const money = value => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
  const duration = minutes => minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)} h${minutes % 60 ? ` ${minutes % 60} min` : ''}`;
  document.getElementById('current-year').textContent = new Date().getFullYear();

  const menuToggle = document.querySelector('.menu-toggle');
  const mobileMenu = document.getElementById('mobile-menu');
  function closeMenu() { menuToggle.setAttribute('aria-expanded', 'false'); mobileMenu.hidden = true; }
  menuToggle.addEventListener('click', () => {
    const open = menuToggle.getAttribute('aria-expanded') !== 'true';
    menuToggle.setAttribute('aria-expanded', String(open));
    mobileMenu.hidden = !open;
  });
  mobileMenu.querySelectorAll('a,button').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('click', event => { if (!event.target.closest('.site-header')) closeMenu(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });
  window.matchMedia('(min-width: 761px)').addEventListener('change', closeMenu);

  const tabs = [...document.querySelectorAll('[data-tab]')];
  const panels = [...document.querySelectorAll('.treatment-panel')];
  document.querySelector('.treatment-tabs').setAttribute('role', 'tablist');
  document.querySelector('.treatments').classList.add('tabs-enhanced');
  function activateTab(tab, focus = false) {
    tabs.forEach(button => {
      const active = button === tab;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-selected', String(active));
      button.tabIndex = active ? 0 : -1;
    });
    panels.forEach(panel => { panel.hidden = panel.id !== tab.getAttribute('aria-controls'); });
    if (focus) tab.focus();
  }
  tabs.forEach((tab, index) => {
    tab.setAttribute('role', 'tab');
    tab.addEventListener('click', () => activateTab(tab));
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next !== undefined) { event.preventDefault(); activateTab(tabs[next], true); }
    });
  });
  panels.forEach(panel => { panel.setAttribute('role', 'tabpanel'); panel.tabIndex = 0; });
  activateTab(tabs[0]);

  let dialogTrigger;
  function openDialog(dialog, trigger) {
    dialogTrigger = trigger;
    closeMenu();
    dialog.showModal();
    document.body.classList.add('dialog-open');
  }
  document.querySelectorAll('dialog').forEach(dialog => {
    dialog.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => dialog.close()));
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
    });
    dialog.addEventListener('close', () => {
      document.body.classList.remove('dialog-open');
      dialogTrigger?.focus({ preventScroll: true });
    });
  });

  const services = [
    {group:'Mains & pieds',id:'manucure',name:'Manucure sans vernis',price:20,minutes:20},
    {group:'Mains & pieds',id:'semi',name:'Pose de vernis semi-permanent — mains',price:25,minutes:25,french:true},
    {group:'Mains & pieds',id:'semi-pieds',name:'Pose de vernis semi-permanent — pieds',price:25,minutes:25,french:true},
    {group:'Mains & pieds',id:'pieds',name:'Beauté des pieds sans vernis',price:30,minutes:30},
    {group:'Mains & pieds',id:'pieds-semi',name:'Beauté des pieds + vernis semi-permanent',price:45,minutes:50,french:true},
    {group:'Mains & pieds',id:'depose-ongles',name:'Dépose (gel ou résine) + manucure',price:15,minutes:15},
    {group:'Résine & French',id:'capsules',name:'Pose de capsules en résine + vernis semi-permanent',price:45,minutes:50,french:true},
    {group:'Résine & French',id:'comblage',name:'Remplissage résine + semi-permanent',price:40,minutes:50,french:true},
    {group:'Les cils',id:'cils-classique',name:'Extension de cils à cils — effet naturel',price:60,minutes:90},
    {group:'Les cils',id:'cils-russe',name:'Extensions volume russe',price:70,minutes:90},
    {group:'Les cils',id:'cils-mega',name:'Extensions cils méga volume',price:85,minutes:90},
    {group:'Les cils',id:'cils-volume',name:'Comblage volume russe — 3 à 4 semaines',price:60,minutes:90},
    {group:'Les cils',id:'cils-depose',name:'Dépose des extensions de cils',price:20,minutes:30}
  ];
  const select = document.getElementById('service-select');
  const extras = document.getElementById('extras-fieldset');
  const effect = document.getElementById('effect-extra');
  const total = document.getElementById('selection-total');
  const selectedDuration = document.getElementById('selection-duration');
  const bookingDialog = document.getElementById('booking-dialog');
  const notice = document.getElementById('booking-notice');
  const feedback = document.getElementById('selection-feedback');
  let group;
  services.forEach(service => {
    if (!group || group.label !== service.group) {
      group = document.createElement('optgroup'); group.label = service.group; select.append(group);
    }
    const option = document.createElement('option'); option.value = service.id;
    option.textContent = `${service.name} — ${money(service.price)} · ${duration(service.minutes)}`;
    group.append(option);
  });
  select.value = 'semi';
  const selectedService = () => services.find(service => service.id === select.value);
  const selectedTotal = () => {
    const service = selectedService();
    return service.price + (service.french && effect.checked ? 5 : 0);
  };
  const selectedMinutes = () => selectedService().minutes + (selectedService().french && effect.checked ? 30 : 0);
  function safeWebUrl(value) {
    try { const url = new URL(value); return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : ''; } catch { return ''; }
  }
  const bookingUrl = safeWebUrl(config.bookingUrl);
  function updateSelection() {
    const service = selectedService();
    extras.hidden = !service.french;
    effect.disabled = !service.french;
    const amount = selectedTotal();
    total.textContent = money(amount);
    selectedDuration.textContent = duration(selectedMinutes());
    notice.textContent = [service.note || '', bookingUrl ? 'Vous allez être redirigée vers le service de réservation du salon pour choisir et confirmer votre créneau.' : 'La réservation en ligne sera bientôt disponible. Vous pouvez enregistrer votre sélection ; elle ne constitue pas une réservation.'].filter(Boolean).join(' ');
    feedback.textContent = '';
  }
  select.addEventListener('change', () => { effect.checked = false; updateSelection(); });
  effect.addEventListener('change', updateSelection);
  document.querySelectorAll('[data-booking]').forEach(button => button.addEventListener('click', () => {
    if (button.dataset.service) { select.value = button.dataset.service; effect.checked = false; }
    updateSelection(); openDialog(bookingDialog, button);
  }));
  document.getElementById('selection-form').addEventListener('submit', event => {
    event.preventDefault();
    const service = selectedService();
    const lines = ['SHI BEAUTY — MA SÉLECTION DE SOINS', '', service.name, `Prix : ${money(service.price)}`, `Durée : ${duration(service.minutes)}`];
    if (service.french && effect.checked) lines.push('French : +5 € · 30 min');
    lines.push('', `TOTAL : ${money(selectedTotal())}`, `DURÉE PRÉVUE : ${duration(selectedMinutes())}`);
    if (service.note) lines.push(service.note);
    if (config.address) lines.push('', config.address);
    if (config.phone) lines.push(`Téléphone : ${config.phone}`);
    if (bookingUrl) lines.push(`Réservation : ${bookingUrl}`);
    lines.push('', 'Cette sélection ne constitue pas une réservation. Le créneau doit être confirmé auprès du salon.');
    const blobUrl = URL.createObjectURL(new Blob(['\ufeff' + lines.join('\n')], { type:'text/plain;charset=utf-8' }));
    const link = document.createElement('a'); link.href = blobUrl; link.download = 'shi-beauty-ma-selection.txt';
    document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    feedback.textContent = 'Votre récapitulatif a été préparé pour le téléchargement.';
  });
  if (bookingUrl) {
    const external = document.getElementById('booking-external'); external.href = bookingUrl; external.hidden = false;
    document.querySelectorAll('[data-booking-link]').forEach(link => { link.href = bookingUrl; });
  }
  updateSelection();

  const galleryDialog = document.getElementById('gallery-dialog');
  const galleryImage = document.getElementById('gallery-image');
  const galleryCaption = document.getElementById('gallery-caption');
  const galleryButtons = [...document.querySelectorAll('[data-gallery]')];
  let imageIndex = 0;
  function showImage(index) {
    imageIndex = (index + galleryButtons.length) % galleryButtons.length;
    const trigger = galleryButtons[imageIndex]; const source = trigger.querySelector('img');
    galleryImage.src = source.src; galleryImage.alt = source.alt;
    galleryCaption.textContent = trigger.closest('figure').querySelector('figcaption>span').textContent;
    document.getElementById('gallery-counter').textContent = `${imageIndex + 1} / ${galleryButtons.length}`;
  }
  galleryButtons.forEach((button,index) => button.addEventListener('click', () => { showImage(index); openDialog(galleryDialog, button); }));
  document.getElementById('gallery-prev').addEventListener('click', () => showImage(imageIndex - 1));
  document.getElementById('gallery-next').addEventListener('click', () => showImage(imageIndex + 1));
  galleryDialog.addEventListener('keydown', event => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); showImage(imageIndex + (event.key === 'ArrowRight' ? 1 : -1)); }
  });
  document.getElementById('legal-open').addEventListener('click', event => openDialog(document.getElementById('legal-dialog'), event.currentTarget));

  const contact = document.getElementById('salon-contact');
  function addContact(label, href) {
    const element = document.createElement(href ? 'a' : 'span'); element.textContent = label;
    if (href) element.href = href; contact.append(element);
  }
  if (config.address) addContact(config.address);
  if (config.phone) addContact(config.phone, 'tel:' + config.phone.replace(/[^\d+]/g,''));
  if (config.email) addContact(config.email, 'mailto:' + config.email);
  const instagram = safeWebUrl(config.instagramUrl);
  if (instagram) addContact('Instagram ↗', instagram);
  if (contact.children.length) { contact.hidden = false; document.querySelector('[data-contact-placeholder]').hidden = true; }
  if (config.legalName) {
    const editor = document.querySelector('#legal-content>p');
    editor.textContent = [config.legalName,config.registrationNumber && 'Immatriculation : ' + config.registrationNumber, config.address, config.phone, config.email].filter(Boolean).join(' · ');
  }

  const mobileBooking = document.querySelector('.mobile-booking');
  const hero = document.querySelector('.hero');
  const footer = document.querySelector('.site-footer');
  let heroPassed = false; let footerVisible = false;
  function updateMobileBooking() { mobileBooking.classList.toggle('is-visible', heroPassed && !footerVisible); }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => { heroPassed = !entries[0].isIntersecting && entries[0].boundingClientRect.bottom < 110; updateMobileBooking(); }, {threshold:0}).observe(hero);
    new IntersectionObserver(entries => { footerVisible = entries[0].isIntersecting; updateMobileBooking(); }, {threshold:0}).observe(footer);
    const sectionObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        document.querySelectorAll('.desktop-nav a').forEach(link => {
          if (link.hash === '#' + entry.target.id) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        });
      });
    }, {rootMargin:'-20% 0px -60% 0px'});
    document.querySelectorAll('main>section[id]').forEach(section => sectionObserver.observe(section));
  }
})();
