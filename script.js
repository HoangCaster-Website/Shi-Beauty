(() => {
  'use strict';
  const config = window.SALON_CONFIG || {};
  const money = value => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
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
    {group:'Mains & pieds',id:'manucure',name:'Manucure',price:20,nails:true},
    {group:'Mains & pieds',id:'semi',name:'Vernis semi-permanent',price:25,nails:true},
    {group:'Mains & pieds',id:'pieds',name:'Beauté des pieds sans vernis',price:35},
    {group:'Mains & pieds',id:'pieds-semi',name:'Beauté des pieds + semi-permanent',price:45,nails:true},
    {group:'Mains & pieds',id:'pieds-resine',name:'Résine sur les ongles des pieds + vernis',price:35,nails:true},
    {group:'Extensions & nail art',id:'capsules',name:'Capsules + résine + semi-permanent',price:45,nails:true},
    {group:'Extensions & nail art',id:'comblage',name:'Comblage des ongles — pose initiale −5 €',price:null,note:'Comblage : 5 € de moins que le tarif de votre pose initiale. Le montant sera confirmé au salon.'},
    {group:'Extensions & nail art',id:'design',name:'Design complet',price:null,note:'Le tarif du design complet est établi sur devis au salon.'},
    {group:'Beauté du regard',id:'cils-classique',name:'Pose de cils classique',price:60},
    {group:'Beauté du regard',id:'cils-comblage',name:'Comblage classique — 3 semaines',price:50},
    {group:'Beauté du regard',id:'cils-russe',name:'Pose volume russe',price:70},
    {group:'Beauté du regard',id:'cils-mega',name:'Pose méga volume',price:85},
    {group:'Beauté du regard',id:'cils-mixte',name:'Pose mixte',price:70},
    {group:'Beauté du regard',id:'cils-volume',name:'Comblage volume — 3 à 4 semaines',price:60},
    {group:'Beauté du regard',id:'cils-depose',name:'Dépose de cils',price:20}
  ];
  const select = document.getElementById('service-select');
  const extras = document.getElementById('extras-fieldset');
  const effect = document.getElementById('effect-extra');
  const design = document.getElementById('design-extra');
  const total = document.getElementById('selection-total');
  const bookingDialog = document.getElementById('booking-dialog');
  const notice = document.getElementById('booking-notice');
  const feedback = document.getElementById('selection-feedback');
  let group;
  services.forEach(service => {
    if (!group || group.label !== service.group) {
      group = document.createElement('optgroup'); group.label = service.group; select.append(group);
    }
    const option = document.createElement('option'); option.value = service.id;
    option.textContent = `${service.name} — ${service.price === null ? 'Sur devis' : money(service.price)}`;
    group.append(option);
  });
  select.value = 'semi';
  const selectedService = () => services.find(service => service.id === select.value);
  const selectedTotal = () => {
    const service = selectedService();
    return service.price === null ? null : service.price + (service.nails && effect.checked ? 5 : 0) + (service.nails && design.checked ? 5 : 0);
  };
  function safeWebUrl(value) {
    try { const url = new URL(value); return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : ''; } catch { return ''; }
  }
  const bookingUrl = safeWebUrl(config.bookingUrl);
  function updateSelection() {
    const service = selectedService();
    extras.hidden = !service.nails;
    effect.disabled = design.disabled = !service.nails;
    const amount = selectedTotal();
    total.textContent = amount === null ? 'Sur devis' : money(amount);
    notice.textContent = [service.note || '', bookingUrl ? 'Vous allez être redirigée vers le service de réservation du salon pour choisir et confirmer votre créneau.' : 'La réservation en ligne sera bientôt disponible. Vous pouvez enregistrer votre sélection ; elle ne constitue pas une réservation.'].filter(Boolean).join(' ');
    feedback.textContent = '';
  }
  select.addEventListener('change', () => { effect.checked = design.checked = false; updateSelection(); });
  effect.addEventListener('change', updateSelection);
  design.addEventListener('change', updateSelection);
  document.querySelectorAll('[data-booking]').forEach(button => button.addEventListener('click', () => {
    if (button.dataset.service) { select.value = button.dataset.service; effect.checked = design.checked = false; }
    updateSelection(); openDialog(bookingDialog, button);
  }));
  document.getElementById('selection-form').addEventListener('submit', event => {
    event.preventDefault();
    const service = selectedService();
    const lines = ['SHI BEAUTY — MA SÉLECTION DE SOINS', '', service.name, `Prix : ${service.price === null ? 'Sur devis' : money(service.price)}`];
    if (service.nails && effect.checked) lines.push('French, baby boomer, chrome ou cat eye : +5 €');
    if (service.nails && design.checked) lines.push('Design d’un ongle : +5 €');
    lines.push('', `TOTAL : ${selectedTotal() === null ? 'Sur devis' : money(selectedTotal())}`);
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
    document.getElementById('booking-help')?.remove();
    document.querySelector('[data-booking-help]').textContent = 'Choisissez votre soin, puis consultez les disponibilités sur notre service de réservation. Votre rendez-vous sera confirmé sur ce service.';
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
