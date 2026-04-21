/* NEXUS RAJAN - TRACKER PRO — Common JS
   © Copyright NEXUS RAJAN 2026 DJIBOUTI */
window.NT = window.NT || {};
NT.COPYRIGHT = '\u00A9 Copyright NEXUS RAJAN 2026 DJIBOUTI';
NT.lang = localStorage.getItem('nt_lang') || 'en';

NT.translations = {
    en: {
        live_map: 'Live Map', route_replay: 'Route Replay',
        tasks: 'Tasks', employees: 'Employees', clients: 'Clients',
        alerts: 'Alerts', reports: 'Reports', save: 'Save', cancel: 'Cancel',
        active: 'Active', idle: 'Idle', offline: 'Offline',
    },
    fr: {
        live_map: 'Carte en direct', route_replay: 'Replay d\'itinéraire',
        tasks: 'Tâches', employees: 'Employés', clients: 'Clients',
        alerts: 'Alertes', reports: 'Rapports', save: 'Enregistrer', cancel: 'Annuler',
        active: 'Actif', idle: 'Inactif', offline: 'Hors ligne',
    },
    it: {
        live_map: 'Mappa in tempo reale', route_replay: 'Replay del percorso',
        tasks: 'Attività', employees: 'Dipendenti', clients: 'Clienti',
        alerts: 'Avvisi', reports: 'Report', save: 'Salva', cancel: 'Annulla',
        active: 'Attivo', idle: 'Inattivo', offline: 'Offline',
    }
};

NT.t = function(key) {
    var t = NT.translations[NT.lang];
    return (t && t[key]) || NT.translations.en[key] || key;
};

NT.set_lang = function(lang) {
    localStorage.setItem('nt_lang', lang);
    NT.lang = lang;
    frappe.msgprint('Language changed. Refreshing...');
    setTimeout(function(){ location.reload(); }, 800);
};

NT.copyright_footer = function(parent) {
    $(parent).append($('<div class="nt-copyright">').text(NT.COPYRIGHT));
};
